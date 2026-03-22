# Tiffin Center MVP

This workspace now contains a simple full-stack tiffin center application:

- `backend/`: Spring Boot API
- `frontend/`: Angular UI

## Features

- Customer menu view
- Customer order placement with paid or unpaid status
- Admin login
- Admin food item create and update
- End-of-day summary with total orders, paid vs unpaid, revenue, and item sales

## Backend

```bash
cd backend
mvn spring-boot:run
```

Backend URL:

- `http://localhost:8080`

Default admin credentials:

- Username: `admin`
- Password: `admin123`

## Frontend

```bash
cd frontend
npm install
npm start
```

Frontend URL:

- `http://localhost:4200`

## Main routes

- Customer page: `http://localhost:4200/`
- Admin page: `http://localhost:4200/admin`

## Notes

- The backend uses an H2 file database stored under `backend/data`.
- Admin endpoints use a simple demo token-based interceptor after login. This is enough for an MVP, not production-grade security.

## Run With Docker

The Angular and Spring Boot apps also have separate Dockerfiles:

- [`frontend/Dockerfile`](/Users/naresh/Desktop/PythonMaster/frontend/Dockerfile)
- [`backend/Dockerfile`](/Users/naresh/Desktop/PythonMaster/backend/Dockerfile)

To run both together:

```bash
cd /Users/naresh/Desktop/PythonMaster
docker compose -f docker-compose.tiffin.yml up --build
```

Container URLs:

- Frontend: `http://localhost:4200`
- Backend API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
