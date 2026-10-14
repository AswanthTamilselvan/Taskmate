
import { useState, useEffect } from "react";
import "./index.css";


const API_BASE = "/api";
const API_URL = `${API_BASE}/tasks`;


function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("all");

  // Check whether the user is already logged in.
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE}/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
        }
      } catch {
        setAuthError(
          "Cannot connect to Flask. Check that the backend is running."
        );
      } finally {
        setAuthLoading(false);
      }
    }

    checkSession();
  }, []);

  // Fetch tasks whenever the logged-in user changes.
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    async function fetchTasks() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load tasks.");
        }

        setTasks(data);
      } catch (err) {
        setError(err.message || "Could not load tasks.");
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [user]);

  // Handle login and registration.
  async function handleAuthSubmit(e) {
    e.preventDefault();
    
if (authMode === "register") {
  const password = authForm.password;

  
const strongPassword =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/;


  if (!strongPassword.test(password)) {
    setAuthError(
      "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
    );
    return;
  }
}

    setAuthError("");
    setAuthMessage("");

    const endpoint =
      authMode === "login" ? "/login" : "/register";

    const body =
      authMode === "login"
        ? {
            email: authForm.email,
            password: authForm.password,
          }
        : authForm;

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      if (authMode === "register") {
        setAuthMessage(
          "Registration successful! You can now log in."
        );

        setAuthMode("login");

        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
        });
      } else {
        setUser(data.user);

        setAuthForm({
          name: "",
          email: "",
          password: "",
        });

        setAuthError("");
      }
    } catch (err) {
      setAuthError(
        err.message || "Cannot connect to the backend."
      );
    }
  }

  // Log out the current user.
  async function handleLogout() {
    try {
      const response = await fetch(`${API_BASE}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      setUser(null);
      setTasks([]);
      setTaskInput("");
      setEditingId(null);
      setError("");
      setAuthError("");
      setAuthMessage("");
      setAuthMode("login");
      setActiveView("all");
    } catch (err) {
      setError(err.message || "Could not log out.");
    }
  }

  // Add a new task or save an edited task.
  async function handleSubmit(e) {
    e.preventDefault();

    const title = taskInput.trim();

    if (!title) return;

    setError("");

    try {
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save task.");
      }

      if (isEditing) {
        setTasks((current) =>
          current.map((task) =>
            task.id === editingId
              ? { ...task, title }
              : task
          )
        );

        setEditingId(null);
      } else {
        setTasks((current) => [...current, data]);
      }

      setTaskInput("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  }

  // Load a task into the input for editing.
  function handleEdit(task) {
    setTaskInput(task.title);
    setEditingId(task.id);
    setError("");
    setActiveView("all");
  }

  // Delete a task.
  async function handleDelete(id) {
    setError("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete task.");
      }

      setTasks((current) =>
        current.filter((task) => task.id !== id)
      );

      if (editingId === id) {
        setEditingId(null);
        setTaskInput("");
      }
    } catch (err) {
      setError(err.message || "Could not delete task.");
    }
  }

  // Toggle a task between pending and completed.
  async function handleToggle(id) {
    const task = tasks.find((item) => item.id === id);

    if (!task) return;

    const completed = !task.completed;
    setError("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not update task."
        );
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, completed }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "Could not update task.");
    }
  }

  // Cancel editing.
  function handleCancel() {
    setEditingId(null);
    setTaskInput("");
    setError("");
  }

  // Display a loading screen while checking the session.
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          Checking your session...
        </div>
      </div>
    );
  }

  // Login and registration screen.
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-brand">
          <div className="brand-mark">T</div>
          <span>TaskMate</span>
        </div>

        <section className="auth-card">
          <div className="auth-icon">✓</div>

          <p className="eyebrow">
            YOUR PERSONAL WORKSPACE
          </p>

          <h1>
            {authMode === "login"
              ? "Welcome back!"
              : "Create your account"}
          </h1>

          <p className="auth-description">
            {authMode === "login"
              ? "Sign in to pick up where you left off."
              : "Create an account and start organizing your day."}
          </p>

          {authError && (
            <p
              className="notice error-notice"
              role="alert"
            >
              {authError}
            </p>
          )}

          {authMessage && (
            <p
              className="notice success-notice"
              role="status"
            >
              {authMessage}
            </p>
          )}

          <form
            onSubmit={handleAuthSubmit}
            className="auth-form"
          >
            {authMode === "register" && (
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    email: e.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="At least 8 characters"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    password: e.target.value,
                  })
                }
                minLength={8}
                required
              />
              {isRegistering && (
                <div className="password-hint">
                  <p>Password must contain:</p>
                  <ul>
                    <li>At least 8 characters</li>
                    <li>One uppercase letter (A–Z)</li>
                    <li>One lowercase letter (a–z)</li>
                    <li>One number (0–9)</li>
                    <li>One special character (@, #, !, etc.)</li>
                    <li>No spaces</li>
                  </ul>
                </div>
              )} 
            </label>

            <button
              className="primary-button auth-submit"
              type="submit"
            >
              {authMode === "login"
                ? "Sign in"
                : "Create account"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="auth-switch">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}

            <button
              type="button"
              className="text-button"
              onClick={() => {
                setAuthMode(
                  authMode === "login"
                    ? "register"
                    : "login"
                );
                setAuthError("");
                setAuthMessage("");
              }}
            >
              {authMode === "login"
                ? "Sign up"
                : "Sign in"}
            </button>
          </p>
        </section>

        <p className="auth-footer">
          A little progress every day adds up.
        </p>
      </div>
    );
  }

  // Calculate dashboard statistics.
  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingCount = tasks.length - completedCount;

  const progress = tasks.length
    ? Math.round(
        (completedCount / tasks.length) * 100
      )
    : 0;

  // Filter tasks based on the selected sidebar item.
  const filteredTasks = tasks.filter((task) => {
    if (activeView === "pending") {
      return !task.completed;
    }

    if (activeView === "completed") {
      return task.completed;
    }

    return true;
  });

  const viewTitles = {
    all: "All tasks",
    pending: "Pending tasks",
    completed: "Completed tasks",
  };

  // Modern dashboard.
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">T</div>
          <span>TaskMate</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav
          className="sidebar-nav"
          aria-label="Task navigation"
        >
          <button
            type="button"
            className={`nav-item ${
              activeView === "all" ? "active" : ""
            }`}
            onClick={() => setActiveView("all")}
          >
            <span className="nav-icon">▦</span>
            <span>All tasks</span>
            <span className="nav-count">
              {tasks.length}
            </span>
          </button>

          <button
            type="button"
            className={`nav-item ${
              activeView === "pending" ? "active" : ""
            }`}
            onClick={() => setActiveView("pending")}
          >
            <span className="nav-icon">◷</span>
            <span>Pending</span>
            <span className="nav-count">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            className={`nav-item ${
              activeView === "completed" ? "active" : ""
            }`}
            onClick={() => setActiveView("completed")}
          >
            <span className="nav-icon">✓</span>
            <span>Completed</span>
            <span className="nav-count">
              {completedCount}
            </span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">✦</div>
            <strong>Keep going!</strong>
            <p>
              Small steps lead to big results.
            </p>
          </div>

          <div className="sidebar-user">
            <div className="avatar">
              {(user.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="sidebar-user-info">
              <strong>{user.name}</strong>
              <span>Personal workspace</span>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
            >
              ↗
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              PERSONAL WORKSPACE
            </p>
            <h1>My workspace</h1>
          </div>

          <div className="topbar-profile">
            <div className="avatar">
              {(user.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>TaskMate member</span>
            </div>
          </div>
        </header>

        <section className="welcome-banner">
          <div className="welcome-copy">
            <span className="welcome-tag">
              YOUR DAY, YOUR PACE
            </span>

            <h2>
              Welcome back, {user.name}!
            </h2>

            <p>
              Make today count. One task at a time.
            </p>
          </div>

          <div
            className="welcome-decoration"
            aria-hidden="true"
          >
            <span className="decoration-circle circle-one" />
            <span className="decoration-circle circle-two" />
            <span className="decoration-check">✓</span>
          </div>
        </section>

        <section
          className="stats-grid"
          aria-label="Task statistics"
        >
          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon purple-icon">
                ▦
              </span>
              <span className="stat-caption">
                YOUR TASKS
              </span>
            </div>

            <strong className="stat-number">
              {tasks.length}
            </strong>

            <span className="stat-label">
              Total tasks
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon orange-icon">
                ◷
              </span>
              <span className="stat-caption">
                TO DO
              </span>
            </div>

            <strong className="stat-number">
              {pendingCount}
            </strong>

            <span className="stat-label">
              Still on your list
            </span>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span className="stat-icon green-icon">
                ✓
              </span>
              <span className="stat-caption">
                DONE
              </span>
            </div>

            <strong className="stat-number">
              {completedCount}
            </strong>

            <span className="stat-label">
              Tasks completed
            </span>
          </article>

          <article className="stat-card progress-stat">
            <div className="stat-top">
              <span className="stat-icon blue-icon">
                ↗
              </span>
              <span className="stat-caption">
                YOUR PROGRESS
              </span>
            </div>

            <strong className="stat-number">
              {progress}%
            </strong>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span className="stat-label">
              Completion rate
            </span>
          </article>
        </section>

        {error && (
          <p
            className="notice error-notice"
            role="alert"
          >
            {error}
          </p>
        )}

        <section className="task-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                STAY ON TRACK
              </p>

              <h2>
                {editingId !== null
                  ? "Edit your task"
                  : "Manage your tasks"}
              </h2>

              <p className="section-description">
                Add a task, make progress, and celebrate
                getting it done.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="task-form"
          >
            <input
              type="text"
              placeholder="What would you like to get done?"
              value={taskInput}
              onChange={(e) =>
                setTaskInput(e.target.value)
              }
              aria-label="Task title"
              required
            />

            <button
              type="submit"
              className="primary-button"
            >
              <span aria-hidden="true">
                {editingId !== null ? "✓" : "+"}
              </span>

              {editingId !== null
                ? "Save changes"
                : "Add task"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </form>

          <div className="task-list-heading">
            <h3>{viewTitles[activeView]}</h3>

            <span>
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1
                ? "task"
                : "tasks"}
            </span>
          </div>

          <div className="task-list">
            {loading ? (
              <div className="empty-state">
                <p>Loading your tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  {activeView === "completed"
                    ? "✓"
                    : "＋"}
                </div>

                <h3>
                  {activeView === "completed"
                    ? "Nothing completed yet"
                    : activeView === "pending"
                    ? "You're all caught up!"
                    : "Your task list is ready"}
                </h3>

                <p>
                  {activeView === "completed"
                    ? "Complete a task and it will appear here."
                    : activeView === "pending"
                    ? "There are no pending tasks right now."
                    : "Add your first task above to get started."}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <article
                  className={`task-item ${
                    task.completed ? "is-completed" : ""
                  }`}
                  key={task.id}
                >
                  <label className="task-label">
                    <input
                      type="checkbox"
                      checked={Boolean(task.completed)}
                      onChange={() =>
                        handleToggle(task.id)
                      }
                      aria-label={`Mark ${task.title} as ${
                        task.completed
                          ? "pending"
                          : "completed"
                      }`}
                    />

                    <span
                      className="custom-checkbox"
                      aria-hidden="true"
                    >
                      {task.completed ? "✓" : ""}
                    </span>

                    <span
                      className={`task-title ${
                        task.completed ? "completed" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </label>

                  <div className="task-row-right">
                    <span
                      className={`task-status ${
                        task.completed
                          ? "status-done"
                          : "status-pending"
                      }`}
                    >
                      {task.completed
                        ? "Completed"
                        : "Pending"}
                    </span>

                    <div className="task-actions">
                      <button
                        type="button"
                        className="icon-button edit-action"
                        onClick={() => handleEdit(task)}
                        aria-label={`Edit ${task.title}`}
                        title="Edit task"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="icon-button delete-action"
                        onClick={() =>
                          handleDelete(task.id)
                        }
                        aria-label={`Delete ${task.title}`}
                        title="Delete task"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <footer className="dashboard-footer">
          Made for progress, one task at a time.{" "}
          <span>TaskMate</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
