import { useState } from "react";

function AddTodo({ onAdd }) {
  // Store the to-do text entered by the user.
  const [text, setText] = useState("");
  // Store the selected due date.
  const [dueDate, setDueDate] = useState("");
  // Track whether the form is currently being submitted.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission.
  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedText = text.trim();
    // Do not submit if the task text is empty.
    if (!trimmedText || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Send the new to-do item to the parent component.
      const success = await onAdd(trimmedText, dueDate);
      // Clear the form after a successful submission.
      if (success) {
        setText("");
        setDueDate("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="add-todo-panel">
      <h3>Add a To-Do</h3>
      <form className="add-todo-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="todoText">Task</label>
          <input
            id="todoText"
            type="text"
            placeholder="Write a to-do..."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            id="dueDate"
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>

        <button
          className="add-button"
          type="submit"
          disabled={isSubmitting || !text.trim()}
        >
          {isSubmitting ? "Adding..." : "Add To-Do"}
        </button>
      </form>
    </section>
  );
}

export default AddTodo;