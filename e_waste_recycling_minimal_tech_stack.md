# Smart E-Waste Recycling & Sustainability Platform — Minimal Tech Stack

## 1. Frontend
- **React + TypeScript + Vite** — user interface and admin portal.
- **Material UI** — basic UI components and responsive layout.

## 2. Backend
- **Python + FastAPI** — REST APIs and application logic.
- **Pydantic** — request and response validation.

## 3. Databases
- **PostgreSQL + PostGIS** — users, recycling centers, device categories, recycling records, verification status, and points.
- **Psycopg 3** — connect to PostgreSQL and execute raw, parameterized SQL. No ORM.
- **MongoDB + PyMongo** — store AI analysis and image/evidence metadata.

## 4. AI Image Classification
- **PyTorch + pretrained MobileNetV3** — predict the category of an uploaded electronic device.
- Treat predictions as suggestions; allow users to correct the category.

## 5. Authentication
- **Server-side sessions with secure cookies** — login and role-based access for users and admins.
- No JWT.

## 6. Image Storage
- Store uploaded images in a local uploads directory during development.
- Save file paths and metadata in the database. Do not store large image files directly in PostgreSQL or MongoDB.

## 7. Database Setup
- Use **version-controlled SQL files** to create tables, foreign keys, constraints, and indexes.
- Configure PostgreSQL and MongoDB connections using environment variables.
- No ORM or Alembic.

## 8. Development and Testing
- **Git + GitHub** — version control.
- **pytest** — backend tests.
- **Postman** — test API endpoints.
- Keep credentials in a `.env` file and exclude it from Git.

## Minimal Architecture

React frontend → FastAPI backend → PostgreSQL/PostGIS  
　　　　　　　　　　　　　　↘ MongoDB  
　　　　　　　　　　　　　　↘ PyTorch model

## Explicitly Excluded
- JWT and ORM
- QR codes
- Pickup scheduling, collection vehicles, pickup tracking, and logistics
- Microservices or extra databases
