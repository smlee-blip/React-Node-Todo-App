import TodoItem from "./TodoItem";

function TodoList({ todos, onToggle, onEdit, onDelete }) {
  // Show a message when there are no to-do items.
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <p>No to-do items yet.</p>
        <span>Use the form to add your first task.</span>
      </div>
    );
  }

  // Display all to-do items.
  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default TodoList;