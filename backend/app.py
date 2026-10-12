import os
from pathlib import Path
import mysql.connector
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask import Flask, jsonify, request, session

load_dotenv(Path(__file__).with_name(".env"))

app = Flask(__name__)
app.secret_key = os.environ["FLASK_SECRET_KEY"]
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=False,  # Local development only; use True with HTTPS
)

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
)

bcrypt = Bcrypt(app)

def get_db_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password=os.environ.get("MYSQL_PASSWORD", ""),
        database="taskmate_db"
    )

@app.route("/")
def home():
    return jsonify({"message": "TaskMate backend is running!"})


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    user_id = require_login()

    if user_id is None:
        return jsonify({"error": "Please log in first"}), 401

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT id, title, completed
            FROM tasks
            WHERE user_id = %s
            """,
            (user_id,)
        )

        tasks = cursor.fetchall()

        for task in tasks:
            task["completed"] = bool(task["completed"])

        return jsonify(tasks)

    finally:
        cursor.close()
        connection.close()



@app.route("/api/tasks", methods=["POST"])
def add_task():
    user_id = require_login()

    if user_id is None:
        return jsonify({"error": "Please log in first"}), 401

    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()

    if not title:
        return jsonify({"error": "Task title is required"}), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO tasks (title, completed, user_id)
            VALUES (%s, %s, %s)
            """,
            (title, False, user_id)
        )

        connection.commit()
        task_id = cursor.lastrowid

        return jsonify({
            "id": task_id,
            "title": title,
            "completed": False
        }), 201

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()



@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    user_id = require_login()

    if user_id is None:
        return jsonify({"error": "Please log in first"}), 401

    data = request.get_json(silent=True) or {}
    title = data.get("title")
    completed = data.get("completed")

    if title is None and completed is None:
        return jsonify({"error": "No changes provided"}), 400

    if title is not None:
        if not isinstance(title, str) or not title.strip():
            return jsonify({"error": "Task title is required"}), 400
        title = title.strip()

    if completed is not None and not isinstance(completed, bool):
        return jsonify({"error": "Completed must be true or false"}), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        if title is not None and completed is not None:
            cursor.execute(
                """
                UPDATE tasks
                SET title = %s, completed = %s
                WHERE id = %s AND user_id = %s
                """,
                (title, completed, task_id, user_id)
            )
        elif title is not None:
            cursor.execute(
                """
                UPDATE tasks SET title = %s
                WHERE id = %s AND user_id = %s
                """,
                (title, task_id, user_id)
            )
        else:
            cursor.execute(
                """
                UPDATE tasks SET completed = %s
                WHERE id = %s AND user_id = %s
                """,
                (completed, task_id, user_id)
            )

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Task not found or no changes made"
            }), 404

        return jsonify({"message": "Task updated successfully"})

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()



@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    user_id = require_login()

    if user_id is None:
        return jsonify({"error": "Please log in first"}), 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM tasks
            WHERE id = %s AND user_id = %s
            """,
            (task_id, user_id)
        )

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Task not found"}), 404

        return jsonify({"message": "Task deleted successfully"})

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email, and password are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must be at least 8 characters"
        }), 400

    password_hash = bcrypt.generate_password_hash(
        password
    ).decode("utf-8")

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
            """,
            (name, email, password_hash)
        )

        connection.commit()

        return jsonify({
            "message": "Registration successful"
        }), 201

    except mysql.connector.IntegrityError:
        if connection:
            connection.rollback()

        return jsonify({
            "error": "This email is already registered"
        }), 409

    except mysql.connector.Error:
        if connection:
            connection.rollback()

        app.logger.exception("Registration database error")

        return jsonify({
            "error": "Registration failed due to a database error"
        }), 500

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "error": "Email and password are required"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user or not bcrypt.check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        # Remember which user is logged in
        session.clear()
        session["user_id"] = user["id"]
        session["user_name"] = user["name"]

        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "message": "Logout successful"
    }), 200


@app.route("/api/me", methods=["GET"])
def current_user():
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({"user": None}), 200

    return jsonify({
        "user": {
            "id": user_id,
            "name": session.get("user_name")
        }
    }), 200




def require_login():
    user_id = session.get("user_id")

    if user_id is None:
        return None

    return user_id

if __name__ == "__main__":
    app.run(debug=True, port=5000)
