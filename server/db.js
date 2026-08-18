const fs = require("fs");
const path = require("path");

// If TURSO_DATABASE_URL exists, the application uses Turso.
// Otherwise, use the local SQLite database outside Vercel.
const useTurso = Boolean(process.env.TURSO_DATABASE_URL);
const useLocalSqlite = !useTurso && !process.env.VERCEL;

// SQL command used to create the todos table.
const createTodosTableSql = `
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    due_date TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

// Store the local database connection after it is created.
let localDatabase;
// Store the Turso connection promise.
let tursoClientPromise;
// Store the database initialization promise.
let initializationPromise;

// Open or create the local SQLite database.
function getLocalDatabase() {
  if (!localDatabase) {
    const { DatabaseSync } = require("node:sqlite");
    const dataDirectory = path.join(__dirname, "data");

    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    // Define the complete SQLite database file path.
    const databasePath = path.join(
      dataDirectory,
      "todos.db"
    );

    localDatabase = new DatabaseSync(databasePath);
  }
  // Return the saved local database connection.
  return localDatabase;
}

// Connect to the Turso database used by Vercel.
async function getTursoClient() {
  if (!tursoClientPromise) {
    // Dynamically import the web client.
    tursoClientPromise = import("@libsql/client/web").then(
      ({ createClient }) => {
        if (!process.env.TURSO_AUTH_TOKEN) {
          throw new Error(
            "TURSO_AUTH_TOKEN is not configured."
          );
        }
        // Create and return the Turso database client.
        return createClient({
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        });
      }
    );
  }

  return tursoClientPromise;
}

// Create the todos table in the selected database.
async function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      if (useTurso) {
        // Create the table in Turso when running the deployed application.
        const database = await getTursoClient();
        await database.execute(createTodosTableSql);
      } else if (useLocalSqlite) {
        getLocalDatabase().exec(createTodosTableSql);
      } else {
        throw new Error(
          "TURSO_DATABASE_URL is not configured for Vercel."
        );
      }
    })();
  }

  return initializationPromise;
}

// Create the local database when the back-end server starts.
if (useLocalSqlite) {
  getLocalDatabase().exec(createTodosTableSql);
  initializationPromise = Promise.resolve();
}

// Return all matching rows.
async function all(sql, parameters = []) {
  // Make sure the database and table are ready.
  await initializeDatabase();

  if (useTurso) {
    const database = await getTursoClient();
    // Run the query against Turso.
    const result = await database.execute({
      sql,
      args: parameters,
    });

    return result.rows;
  }
  // Run the same query against the local SQLite database.
  return getLocalDatabase()
    .prepare(sql)
    .all(...parameters);
}

// Return the first matching row.
async function get(sql, parameters = []) {
  await initializeDatabase();

  if (useTurso) {
    const database = await getTursoClient();
    const result = await database.execute({
      sql,
      args: parameters,
    });

    return result.rows[0];
  }

  return getLocalDatabase()
    .prepare(sql)
    .get(...parameters);
}

// Run an INSERT, UPDATE, or DELETE statement.
async function run(sql, parameters = []) {
  await initializeDatabase();

  if (useTurso) {
    const database = await getTursoClient();
    const result = await database.execute({
      sql,
      args: parameters,
    });

    return {
      // Number of rows inserted, updated, or deleted.
      changes: result.rowsAffected,
      // Turso can return an ID as a BigInt.
      lastInsertRowid:
        result.lastInsertRowid === undefined
          ? undefined
          : Number(result.lastInsertRowid),
    };
  }
  // Run the write operation against local SQLite.
  const result = getLocalDatabase()
    .prepare(sql)
    .run(...parameters);

  return {
    // Convert SQLite BigInt values into regular numbers.
    changes: Number(result.changes),
    lastInsertRowid: Number(result.lastInsertRowid),
  };
}

module.exports = {
  all,
  get,
  run,
};