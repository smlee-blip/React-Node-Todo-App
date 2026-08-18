# Simple To-Do Application
**Author:** Seung Min Lee

- A simple full-stack To-Do application built with React, Node.js, Express, and SQLite.
- Users can create, edit, complete, and delete tasks, set due dates, identify overdue items, and monitor their overall completion progress.
- Task data is stored persistently in SQLite.
- [GitHub Repository](https://github.com/smlee-blip/React-Node-Todo-App)

## Features
- Add and view to-do items
- Mark tasks as completed or incomplete
- Edit task text and due dates
- Delete tasks with a confirmation prompt
- Highlight overdue tasks
- Display task completion progress
- Store to-do items persistently in SQLite
- Display API connection and request errors
- Responsive blue-themed user interface

## Technologies Used
### Front-End
- React
- JavaScript
- CSS
- Vite
- Fetch API

### Back-End
- Node.js
- Express.js
- CORS

### Database
- SQLite
- Node.js `node:sqlite` module

## Project Structure

```text
React-Node-Todo-App
│
│---- client/
│      │---- src/
│      │     │---- components/
│      │     │      │---- AddTodo.jsx
│      │     │      │---- TodoItem.jsx
│      │     │      │---- TodoList.jsx
│      │     │---- App.jsx
│      │     │---- App.css
│      │     │---- index.css
│      │     │---- main.jsx
│      │
│      │---- index.html
│      │---- package.json
│      │---- package-lock.json
│      │---- vite.config.js
│
│---- server/
│      │---- db.js
│      │---- server.js
│      │---- package.json
│      │---- package-lock.json
│
│---- .gitignore
│---- README.md
```

The `server/data` directory and SQLite database file are generated automatically when the back-end server starts.

## Requirements
- Node.js 22.13.0 or later
- npm
- Check the installed versions:

```bash
node -v
npm -v
```

## Installation 
1. Clone the GitHub repository:

```bash
git clone https://github.com/smlee-blip/React-Node-Todo-App.git
cd React-Node-Todo-App
```

2. Install the back-end dependencies:

```bash
cd server
npm install
cd ..
```

3. Install the front-end dependencies:

```bash
cd client
npm install
cd ..
```

## Running the Application

### Running the Production Build

Build the React application:

```bash
cd client
npm run build
```

Start the Express server:

```bash
cd ../server
npm start
```

Open `http://localhost:5000` in a browser.

## Usage

1. Enter a task in the Task field.
2. Optionally select a due date.
3. Click **Add To-Do** to add the task.
4. Check the checkbox to mark a task as completed.
5. Click **Edit** to update the task or due date.
6. Click **Delete** to remove a task.
7. View the progress bar to track completed tasks.

## Database
- The application uses SQLite for persistent data storage.
- The `server/data` directory is created automatically when the back-end server starts.
- The database file is created at `server/data/todos.db`.
- The database contains a `todos` table with the following fields:
  - `id`
  - `text`
  - `completed`
  - `due_date`
  - `created_at`
- The generated database file is excluded from Git.

## API Endpoints
The base API URL is `http://localhost:5000/api/todos`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/todos` | Returns all to-do items |
| `POST` | `/api/todos` | Creates a new to-do item |
| `PUT` | `/api/todos/:id` | Updates an existing to-do item |
| `DELETE` | `/api/todos/:id` | Deletes a to-do item |
