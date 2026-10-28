import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.db.postgres import close_postgres_pool, get_pool, init_postgres_pool
from app.routes import ai, analytics, auth, categories, centers, records, rewards


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # >>> DB-INTEGRATION-POINT: Open PostgreSQL pool only in real mode
    if settings.DB_MODE == "postgres":
        init_postgres_pool()

    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    yield

    # Clean up pools on shutdown
    close_postgres_pool()


settings = get_settings()

app = FastAPI(
    title="Smart E-Waste Recycling & Sustainability Platform API",
    description="Full REST API with server-side sessions, spatial nearby center search, atomic points awards, and MobileNetV3 AI classifier.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount Routers
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(centers.router)
app.include_router(records.router)
app.include_router(rewards.router)
app.include_router(analytics.router)
app.include_router(ai.router)


@app.get("/api/health", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check():
    """
    Health check endpoint reporting active operating modes and connectivity.
    """
    db_connected = False

    if settings.DB_MODE == "postgres":
        pool = get_pool()
        if pool is not None:
            try:
                with pool.connection(timeout=2.0) as conn:
                    with conn.cursor() as cur:
                        cur.execute("SELECT 1")
                        db_connected = True
            except Exception:
                db_connected = False
    else:
        db_connected = True  # Mock mode is always available

    return {
        "status": "healthy",
        "db_mode": settings.DB_MODE,
        "ai_mode": settings.AI_MODE,
        "postgres_connected": db_connected,
    }
