# Taskmate: A Modern Full Stack Task Management System
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-Latest-green.svg)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/Docker-Compatible-blue.svg)](https://www.docker.com/)

A sophisticated task management system built with React and Flask, featuring real-time updates, animated UI components, and containerized deployment. This project demonstrates modern full-stack development practices, DevOps principles, and clean architecture.

## 🌟 Key Features

- **Responsive Dashboard**: Modern, animated interface built with React and Tailwind CSS
- **Real-time Task Management**: Create, update, delete, and track tasks seamlessly
- **Smart Filtering**: Filter tasks by status (All, Active, Completed) with instant search
- **Progress Tracking**: Visual statistics showing task completion metrics
- **Containerized Architecture**: Docker-based deployment for consistent development and production environments
- **RESTful API**: Well-structured Flask backend with SQLite persistence
- **Animated UI**: Smooth transitions and interactions using Framer Motion

## 🏗️ Project Architecture

<figure >
  <p align="center">
      <img src="./assets/diagram.png" alt="project architecture" />
      <p align="center">Task Master Project Architecture</p> 
  </p>
</figure>

## 🚀 Tech Stack

### Frontend
- React 18.3.1 with Hooks
- Tailwind CSS for responsive design
- Framer Motion for fluid animations
- Axios for API communication
- Modern JavaScript (ES6+)

### Backend
- Flask RESTful architecture
- SQLite database for persistence
- Flask-CORS for cross-origin handling
- Python 3.x

### DevOps & Tools
- Docker & Docker Compose
- Multi-container orchestration
- Git for version control
- npm for package management

## 💻 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Node.js and npm (for local development)
- Python 3.x (for local development)

### Installation

1. Launch with Docker Compose:
```bash
docker-compose up --build
```

2. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Project Structure

```
task-master-pro/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── components/
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

## 🛠️ Development

### Local Development
```bash
# Frontend
cd frontend
npm install
npm start

# Backend
cd backend
pip install -r requirements.txt
flask run
```

### Docker Development
```bash
# Build and run all services
docker-compose up --build

# Stop services
docker-compose down
```

