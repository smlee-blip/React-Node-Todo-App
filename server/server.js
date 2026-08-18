const express = require("express");
const path = require("path");
const cors = require("cors");
const db = require("./db");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Convert SQLite data into a format that is easier to use in React.
function formatTodo(row) {
  return {
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

// Check whether a due date is a real date with a four-digit year.
function isValidDueDate(dueDate) {
  // The due date is optional.
  if (
    dueDate === undefined ||
    dueDate === null ||
    dueDate === ""
  ) {
    return true;
  }

  // Require the exact YYYY-MM-DD format.
  if (
    typeof dueDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
  ) {
    return false;
  }

  const [year, month, day] = dueDate
    .split("-")
    .map(Number);

  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12
  ) {
    return false;
  }

  const isLeapYear =
    year % 400 === 0 ||
    (year % 4 === 0 && year % 100 !== 0);

  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

// GET /api/todos: Get all to-do items.
app.get("/api/todos", (req, res) => {
  try {
    const statement = db.prepare(`SELECT * FROM todos ORDER BY id DESC`);
    const rows = statement.all();
    const todos = rows.map(formatTodo);

    res.json(todos);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not get to-do items.",
    });
  }
});

// POST /api/todos: Add a new to-do item.
app.post("/api/todos", (req, res) => {
  try {
    const body = req.body ?? {};

    if (typeof body.text !== "string" || !body.text.trim()) {
      return res.status(400).json({
        message: "To-do text is required.",
      });
    }

    if (!isValidDueDate(body.dueDate)) {
      return res.status(400).json({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });
    }

    const text = body.text.trim();
    const dueDate = body.dueDate || null;

    const statement = db.prepare(`
      INSERT INTO todos (text, completed, due_date)
      VALUES (?, 0, ?)
    `);

    const result = statement.run(text, dueDate);

    // Retrieve the newly created to-do item.
    const newTodo = db
      .prepare(`SELECT * FROM todos WHERE id = ?`)
      .get(result.lastInsertRowid);

    res.status(201).json(formatTodo(newTodo));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not add the to-do item.",
    });
  }
});

// PUT /api/todos/:id: Update an existing to-do item.
app.put("/api/todos/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body ?? {};

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid to-do ID.",
      });
    }

    // Check whether the to-do item exists.
    const existingTodo = db
      .prepare(`SELECT * FROM todos WHERE id = ?`)
      .get(id);

    if (!existingTodo) {
      return res.status(404).json({
        message: "To-do item not found.",
      });
    }

    if (
      body.text !== undefined &&
      (typeof body.text !== "string" || !body.text.trim())
    ) {
      return res.status(400).json({
        message: "To-do text is required.",
      });
    }

    if (
      body.completed !== undefined &&
      typeof body.completed !== "boolean"
    ) {
      return res.status(400).json({
        message: "Completed must be true or false.",
      });
    }

    if (!isValidDueDate(body.dueDate)) {
      return res.status(400).json({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });
    }

    const text =
      body.text !== undefined ? body.text.trim() : existingTodo.text;

    const completed =
      body.completed !== undefined 
        ? body.completed 
          ? 1 
          : 0 
        : existingTodo.completed;

    const dueDate =
      body.dueDate !== undefined 
        ? body.dueDate || null 
        : existingTodo.due_date;

    const statement = db.prepare(`
      UPDATE todos
      SET text = ?, completed = ?, due_date = ?
      WHERE id = ?
    `);

    statement.run(text, completed, dueDate, id);

    // Retrieve the updated to-do item.
    const updatedTodo = db
      .prepare(`SELECT * FROM todos WHERE id = ?`)
      .get(id);

    res.json(formatTodo(updatedTodo));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update the to-do item.",
    });
  }
});

// DELETE /api/todos/:id: Delete a to-do item.
app.delete("/api/todos/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid to-do ID.",
      });
    }

    const statement = db.prepare(`DELETE FROM todos WHERE id = ?`);
    const result = statement.run(id);

    if (Number(result.changes) === 0) {
      return res.status(404).json({
        message: "To-do item not found.",
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not delete the to-do item.",
    });
  }
});

// Serve the built React application.
const clientDistPath = path.join(
  __dirname,
  "..",
  "client",
  "dist"
);

app.use(express.static(clientDistPath));

// Start the Express server.
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});