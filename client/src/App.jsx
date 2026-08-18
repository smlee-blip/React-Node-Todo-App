import { useEffect, useState } from "react";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import "./App.css";

// During development, Vite and Express run on different ports.
// In production, Express serves the React build, so a relative API path is used.
const API_URL = import.meta.env.DEV
  ? "http://localhost:5000/api/todos"
  : "/api/todos";

function App() {
  // Store all to-do items received from the server.
  const [todos, setTodos] = useState([]);
  // Track whether the initial to-do list is loading.
  const [isLoading, setIsLoading] = useState(true);
  // Store an error message to display to the user.
  const [error, setError] = useState("");
  
  // Load all to-do items when the application starts.
  useEffect(() => {
    async function loadTodos() {
      try {
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Could not load to-do items.");
        }

        const data = await response.json();

        setTodos(data);
      } catch (requestError) {
        console.error(requestError);

        setError(
          "Could not connect to the server. Please make sure the backend server is running."
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadTodos();
  }, []);

  // Add a new to-do item.
  async function addTodo(text, dueDate) {
    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          dueDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not add the to-do.");
      }

      const newTodo = await response.json();

      // Add the new item to the beginning of the list.
      setTodos((currentTodos) => [newTodo, ...currentTodos]);

      return true;
    } catch (requestError) {
      console.error(requestError);

      setError("Could not add the to-do item.");

      return false;
    }
  }

  // Toggle the completed status of a to-do item.
  async function toggleTodo(todo) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !todo.completed,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Could not update the to-do.");
      }

      const updatedTodo = await response.json();

      // Replace the previous item with the updated item.
      setTodos((currentTodos) =>
        currentTodos.map((item) =>
          item.id === updatedTodo.id ? updatedTodo : item
        )
      );
    } catch (requestError) {
      console.error(requestError);

      setError("Could not update the to-do item.");
    }
  }

  // Edit the text and due date of an existing to-do item.
  async function editTodo(id, text, dueDate) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          dueDate,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Could not edit the to-do.");
      }

      const updatedTodo = await response.json();

      // Replace the previous item with the updated item.
      setTodos((currentTodos) =>
        currentTodos.map((item) =>
          item.id === updatedTodo.id ? updatedTodo : item
        )
      );

      return true;
    } catch (requestError) {
      console.error(requestError);

      setError("Could not edit the to-do item.");

      return false;
    }
  }

  // Delete a to-do item.
  async function deleteTodo(id) {
    // Ask the user for confirmation before deleting.
    const confirmed = window.confirm(
      "Are you sure you want to delete this to-do?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });  

      if (!response.ok) {
        throw new Error("Could not delete the to-do.");
      }

      // Remove the deleted item from the list.
      setTodos((currentTodos) =>
        currentTodos.filter((todo) => todo.id !== id)
      );
    } catch (requestError) {
      console.error(requestError);

      setError("Could not delete the to-do item.");
    }
  }

  // Calculate the number of completed tasks.
  const completedCount = todos.filter((todo) => todo.completed).length;
  // Calculate the completed-task percentage for the progress bar.
  const progress =
    todos.length === 0
      ? 0
      : Math.round((completedCount / todos.length) * 100);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Simple To-Do</h1>
        <p>Plan your day, one task at a time.</p>
      </header>

      <main className="todo-card">
        <section className="summary-header">
          <div>
            <h2>From To-Do to Done.</h2>
            <p>
              Completed:{" "}
              <strong>
                {completedCount} / {todos.length}
              </strong>
            </p>
          </div>
          <p className="summary-message">
            Plan it. Track it. Make it happen.
          </p>
        </section>

        <section className="progress-section">
          <div className="progress-label">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div 
            className="progress-track"
            role="progressbar"
            aria-label="To-do completion progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
          >
            <div className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </section>

        {error && (
          <div className="error-message" role="alert">{error}</div>
        )}

        {/* To-Do Content */}
        <div className="todo-layout">
          <AddTodo onAdd={addTodo} />
          <section className="todo-board">
            <h3>My To-Do Board</h3>
            {isLoading ? (
              <div className="loading-message" role="status">
                Loading to-do items...
              </div>
            ) : (
              <TodoList
                todos={todos}
                onToggle={toggleTodo}
                onEdit={editTodo}
                onDelete={deleteTodo}
              />
            )}
          </section>
        </div>

        <div className="help-text">
          <strong>[How to use]</strong>{" "}
           Add a task with an optional due date, check it off when 
           it’s done, and use Edit or Delete to keep your list up 
           to date.
        </div>
      </main>
    </div>
  );
}

export default App;