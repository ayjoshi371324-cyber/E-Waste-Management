# >>> DB-INTEGRATION-POINT: Psycopg 3 Connection Pool
# This is the single file responsible for creating and lifecycle-managing
# the PostgreSQL/PostGIS connection pool using Psycopg 3.
# In DB_MODE=mock, this pool is NEVER instantiated.

import logging
from contextlib import contextmanager
from typing import Generator, Optional, Any

try:
    from psycopg_pool import ConnectionPool
except ImportError:
    ConnectionPool = Any  # type: ignore

try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    psycopg = Any  # type: ignore
    dict_row = Any  # type: ignore

from app.config import get_settings

logger = logging.getLogger(__name__)

_pool: Optional[ConnectionPool] = None


def init_postgres_pool() -> Optional[ConnectionPool]:
    """
    Initializes Psycopg 3 ConnectionPool if DB_MODE == 'postgres'.
    >>> DB-INTEGRATION-POINT: Verify POSTGRES_* credentials, PostGIS extension, and connection health.
    """
    global _pool
    settings = get_settings()

    if settings.DB_MODE != "postgres":
        logger.info("DB_MODE is '%s'. Skipping PostgreSQL pool initialization.", settings.DB_MODE)
        return None

    if _pool is None:
        logger.info("Initializing Psycopg 3 ConnectionPool to %s:%s/%s...",
                    settings.POSTGRES_HOST, settings.POSTGRES_PORT, settings.POSTGRES_DB)
        conninfo = (
            f"host={settings.POSTGRES_HOST} "
            f"port={settings.POSTGRES_PORT} "
            f"dbname={settings.POSTGRES_DB} "
            f"user={settings.POSTGRES_USER} "
            f"password={settings.POSTGRES_PASSWORD}"
        )
        _pool = ConnectionPool(
            conninfo=conninfo,
            min_size=settings.POSTGRES_POOL_MIN_SIZE,
            max_size=settings.POSTGRES_POOL_MAX_SIZE,
            kwargs={"row_factory": dict_row, "autocommit": False},
            open=True,
        )
        logger.info("PostgreSQL ConnectionPool initialized successfully.")

    return _pool


def close_postgres_pool() -> None:
    """Closes the connection pool on application shutdown."""
    global _pool
    if _pool is not None:
        logger.info("Closing Psycopg 3 ConnectionPool...")
        _pool.close()
        _pool = None
        logger.info("PostgreSQL ConnectionPool closed.")


def get_pool() -> Optional[ConnectionPool]:
    """Returns the active ConnectionPool instance or None if not initialized."""
    return _pool


@contextmanager
def get_db_connection() -> Generator[psycopg.Connection, None, None]:
    """
    Context manager providing a psycopg connection from the pool.
    Rolls back on error, commits on normal completion.
    """
    pool = get_pool()
    if pool is None:
        raise RuntimeError("PostgreSQL ConnectionPool is not initialized. Ensure DB_MODE=postgres.")
    
    with pool.connection() as conn:
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
