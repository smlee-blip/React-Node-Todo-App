import { useState } from "react";

// Convert the due date from YYYY-MM-DD to MM/DD/YYYY.
function formatDueDate(dateString) {
  if (!dateString) {
    return "";
  }

  const [year, month, day] = dateString.split("-");

  return `${month}/${day}/${year}`;
}

// Get today's date in YYYY-MM-DD format.
function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  // Track whether the to-do item is being edited.
  const [isEditing, setIsEditing] = useState(false);

  // Store the edited task text.
  const [editText, setEditText] = useState(todo.text);

  // Store the edited due date.
  const [editDueDate, setEditDueDate] = useState(todo.dueDate || "");

  // Start editing and load the current values into the form.
  function startEditing() {
    setEditText(todo.text);
    setEditDueDate(todo.dueDate || "");
    setIsEditing(true);
  }
  
  // Cancel editing and restore the original values.
  function cancelEditing() {
    setEditText(todo.text);
    setEditDueDate(todo.dueDate || "");
    setIsEditing(false);
  }

  // Save the edited task.
  async function saveEditing(event) {
    event.preventDefault();

    const trimmedText = editText.trim();
    // Do not save if the task is empty.
    if (!trimmedText) {
      return;
    }

    const success = await onEdit(todo.id, trimmedText, editDueDate);

    // Exit edit mode after a successful update.
    if (success) {
      setIsEditing(false);
    }
  }

  // Check whether the task is overdue.
  const isOverdue =
    todo.dueDate &&
    !todo.completed &&
    todo.dueDate < getTodayString();

  return (
    <article
      className={`todo-item ${
        todo.completed ? "todo-item-completed" : ""
      }`}
    >
      {isEditing ? (
        <form className="edit-area" onSubmit={saveEditing}>
          <input 
            className="edit-text-input"
            type="text"
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            aria-label="Edit to-do text"
          />

          <input 
            className="edit-date-input"
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={editDueDate}
            onChange={(event) => setEditDueDate(event.target.value)}
            aria-label="Edit due date"
          />

          <div className="edit-buttons">
            <button 
              className="save-button"
              type="submit"
              disabled={!editText.trim()}
            >
              Save
            </button>

            <button 
              className="cancel-button"
              type="button"
              onClick={cancelEditing}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="todo-information">
            <label className="checkbox-container">
              <input 
                type="checkbox"
                checked={todo.completed}
                onChange={() => onToggle(todo)}
                aria-label={
                  todo.completed
                  ? `Mark ${todo.text} as incomplete`
                  : `Mark ${todo.text} as complete`
                }
              />
            </label>

            <div className="todo-text-area">
              <p
                className={`todo-text ${
                  todo.completed ? "completed-text" : ""
                }`}
              >
                {todo.text}
              </p>

              {todo.dueDate && (
                <p
                  className={`due-date ${
                    isOverdue ? "overdue" : ""
                  }`}
                >
                  {isOverdue ? "Overdue: " : "Due: "}
                  {formatDueDate(todo.dueDate)}
                </p>
              )}
            </div>
          </div>

          <div className="todo-actions">
            <button 
              className="edit-button"
              type="button"
              onClick={startEditing}
            >
              Edit
            </button>

            <button 
              className="delete-button"
              type="button"
              onClick={() => onDelete(todo.id)}
            >
              Delete
            </button>
          </div>
        </>
      )}
    </article>
  );
}

export default TodoItem;