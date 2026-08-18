const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

// Define the path to the data directory.
const dataDirectory = path.join(__dirname, "data");

// Create the data directory if it does not exist.
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

// Define the path to the SQLite database file.
const databasePath = path.join(dataDirectory, "todos.db");

// Open the existing database or create a new one.
const db = new DatabaseSync(databasePath);

// Create the todos table if it does not already exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;