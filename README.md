# Smart Expense Tracker

A modern full-stack web application designed to help users track expenses, incomes, and budgets. Built with Spring Boot (Java), React (Vite+Tailwind), and MySQL.

## Features
- **Secure Authentication**: JWT-based stateless authentication with password encryption.
- **Financial Dashboard**: Interactive analytics showing balance and advanced Chart.js graphs for monthly spending trends.
- **Transaction Management**: Add, view, edit, and delete both incomes and expenses securely.
- **Budgeting Planner**: Create limits for custom categories to control monthly spending smartly.
- **Professional UI**: Tailored design with Tailwind CSS, fully responsive and modern.

## Technologies Used
- Frontend: React 18, Vite, Tailwind CSS, Zustand, Chart.js
- Backend: Java 17+, Spring Boot 3, Spring Data JPA, Spring Security (JWT), OpenAPI (Swagger)
- Database: MySQL 8+

## Setup & Deployment Instructions

### Prerequisites
- Java 17 jdk & Maven
- Node.js (v18+)
- Local MySQL or Docker

### 1. Database Setup
Start the local MySQL database using docker:
```bash
docker compose up -d
```
*(Creates database `smart_expense_tracker` on localhost:3306 with root:root)*

### 2. Backend
Navigate to the `backend` folder:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
The REST API will run on `http://localhost:8080`.
Swagger UI is dynamically generated at: `http://localhost:8080/swagger-ui.html`

### 3. Frontend
Navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.
