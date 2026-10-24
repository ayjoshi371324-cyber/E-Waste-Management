# >>> DB-INTEGRATION-POINT: PostgreSQL Sessions Repository
# Executes parameterized queries against the 'sessions' table for server-side sessions.

import json
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from app.db.postgres import get_db_connection
from app.repositories.base import Session, SessionsRepoBase


class PgSessionsRepo(SessionsRepoBase):
    async def create_session(self, session_id: str, user_id: UUID, session_data: Dict[str, Any], expires_at: datetime) -> Session:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO sessions (session_id, user_id, session_data, expires_at, created_at)
                    VALUES (%s, %s, %s::jsonb, %s, CURRENT_TIMESTAMP)
                    RETURNING session_id, user_id, session_data, expires_at, created_at
                    """,
                    (session_id, user_id, json.dumps(session_data), expires_at)
                )
                row = cur.fetchone()
                return Session(**row)

    async def get_session(self, session_id: str) -> Optional[Session]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT session_id, user_id, session_data, expires_at, created_at
                    FROM sessions
                    WHERE session_id = %s AND expires_at > CURRENT_TIMESTAMP
                    """,
                    (session_id,)
                )
                row = cur.fetchone()
                if row:
                    return Session(**row)
                return None

    async def delete_session(self, session_id: str) -> bool:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM sessions WHERE session_id = %s", (session_id,))
                return cur.rowcount > 0

    async def delete_user_sessions(self, user_id: UUID) -> int:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM sessions WHERE user_id = %s", (user_id,))
                return cur.rowcount

    async def cleanup_expired(self) -> int:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP")
                return cur.rowcount
