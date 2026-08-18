const express = require("express");
const path = require("path");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Convert database data into a format for React.
function formatTodo(row) {
  return {
    id: Number(row.id),
    text: row.text,
    completed: Boolean(row.completed),
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

// Check whether a due date is a real date
// with a four-digit year.
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
  // Determine whether February has 28 or 29 days.
  const isLeapYear =
    year % 400 === 0 ||
    (year % 4 === 0 && year % 100 !== 0);
  // Store the maximum number of days in each month.
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
app.get("/api/todos", async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT * FROM todos ORDER BY id DESC`
    );

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
app.post("/api/todos", async (req, res) => {
  try {
    const body = req.body ?? {};
    // The task text must be a non-empty string.
    if (
      typeof body.text !== "string" ||
      !body.text.trim()
    ) {
      return res.status(400).json({
        message: "To-do text is required.",
      });
    }
    // Reject an invalid due date.
    if (!isValidDueDate(body.dueDate)) {
      return res.status(400).json({
        message:
          "Due date must be a valid date in YYYY-MM-DD format.",
      });
    }

    const text = body.text.trim();
    // Store null when no due date was selected.
    const dueDate = body.dueDate || null;
    // Insert the new item into the selected database.
    const result = await db.run(
      `
        INSERT INTO todos (
          text,
          completed,
          due_date
        )
        VALUES (?, 0, ?)
      `,
      [text, dueDate]
    );
    // Retrieve the newly created item using its ID.
    const newTodo = await db.get(
      `SELECT * FROM todos WHERE id = ?`,
      [result.lastInsertRowid]
    );

    res.status(201).json(formatTodo(newTodo));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not add the to-do item.",
    });
  }
});

// PUT /api/todos/:id: Update a to-do item.
app.put("/api/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body ?? {};
    // The ID must be a positive whole number.
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid to-do ID.",
      });
    }
    // Find the current item before updating it.
    const existingTodo = await db.get(
      `SELECT * FROM todos WHERE id = ?`,
      [id]
    );

    if (!existingTodo) {
      return res.status(404).json({
        message: "To-do item not found.",
      });
    }
    // If text was provided, it must be a non-empty string.
    if (
      body.text !== undefined &&
      (
        typeof body.text !== "string" ||
        !body.text.trim()
      )
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
        message:
          "Due date must be a valid date in YYYY-MM-DD format.",
      });
    }
    // Use the new text when it is provided. Otherwise, keep the existing text.
    const text =
      body.text !== undefined
        ? body.text.trim()
        : existingTodo.text;

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
    // Update the matching database row.
    await db.run(
      `
        UPDATE todos
        SET text = ?, completed = ?, due_date = ?
        WHERE id = ?
      `,
      [text, completed, dueDate, id]
    );
    // Retrieve the updated item from the database.
    const updatedTodo = await db.get(
      `SELECT * FROM todos WHERE id = ?`,
      [id]
    );

    res.json(formatTodo(updatedTodo));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not update the to-do item.",
    });
  }
});

// DELETE /api/todos/:id: Delete a to-do item.
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid to-do ID.",
      });
    }
    // Delete the matching item.
    const result = await db.run(
      `DELETE FROM todos WHERE id = ?`,
      [id]
    );

    if (result.changes === 0) {
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

// Serve the React build only during local production use.
// The front end is deployed as a separate Vercel project.
if (!process.env.VERCEL) {
  const clientDistPath = path.join(
    __dirname,
    "..",
    "client",
    "dist"
  );
  // Make the built React files publicly available.
  app.use(express.static(clientDistPath));
}

// Start the Express server.
// Vercel also supports the app.listen pattern.
app.listen(PORT, () => {
  console.log(
    `Server is running at http://localhost:${PORT}`
  );
});

module.exports = app;