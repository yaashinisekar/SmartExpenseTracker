# Smart Expense Tracker - Deployment Guide

## 1. Backend Deployment (Render / Railway)

### Prerequisites
- Build the Spring Boot Application into a JAR file.
- Recommended to manage Java environment with the generated generic `pom.xml`.

### Steps:
1. Ensure your `application.properties` allows dynamic URL resolution for Database connections using Environment variables:
   `spring.datasource.url=${DB_URL}`
2. Connect your GitHub repository to a platform like **Railway** or **Render**.
3. Create a managed MySQL service.
4. Go to your Spring Boot service settings and configure the environment variables:
   - `DB_URL`: JDBC format connection string (e.g. `jdbc:mysql://<mysql-host>:3306/smart_expense_tracker`)
   - `DB_USER`: Your db username
   - `DB_PASSWORD`: Your db password
   - `JWT_SECRET`: Create a strong randomly generated string (min 32 chars).
5. Deploy. The platform will automatically run `mvn clean package` and `java -jar target/smart-expense-tracker-0.0.1-SNAPSHOT.jar`.

## 2. Frontend Deployment (Vercel / Netlify)

### Prerequisites
- Ensure the production URL of your backend is ready.

### Steps:
1. In `api.js`, change the base URL from `http://localhost:8080/api` to use an environment variable:
   `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api'`
2. Connect your GitHub repository to Vercel/Netlify.
3. Set the Framework Preset to **Vite**.
4. In Environment Variables, set `VITE_API_URL` to your backend URL (e.g. `https://my-backend.railway.app/api`).
5. Deploy. 
