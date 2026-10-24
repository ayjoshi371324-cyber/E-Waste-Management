# >>> DB-INTEGRATION-POINT: PostgreSQL Users Repository
# Executes raw parameterized queries against 'users' and 'roles' tables.

import json
from typing import Optional
from uuid import UUID, uuid4
import psycopg

from app.db.postgres import get_db_connection
from app.repositories.base import User, UsersRepoBase


class PgUsersRepo(UsersRepoBase):
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id,
                           r.role_name, u.phone, u.is_active, u.created_at, u.updated_at
                    FROM users u
                    JOIN roles r ON u.role_id = r.role_id
                    WHERE u.id = %s
                    """,
                    (user_id,)
                )
                row = cur.fetchone()
                if row:
                    return User(**row)
                return None

    async def get_by_email(self, email: str) -> Optional[User]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id,
                           r.role_name, u.phone, u.is_active, u.created_at, u.updated_at
                    FROM users u
                    JOIN roles r ON u.role_id = r.role_id
                    WHERE LOWER(u.email) = LOWER(%s)
                    """,
                    (email.strip(),)
                )
                row = cur.fetchone()
                if row:
                    return User(**row)
                return None

    async def create_user(self, email: str, password_hash: str, full_name: str, role_id: int, phone: Optional[str] = None) -> User:
        user_id = uuid4()
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        """
                        INSERT INTO users (id, email, password_hash, full_name, role_id, phone, is_active)
                        VALUES (%s, %s, %s, %s, %s, %s, TRUE)
                        RETURNING id, email, password_hash, full_name, role_id, phone, is_active, created_at, updated_at
                        """,
                        (user_id, email.strip().lower(), password_hash, full_name.strip(), role_id, phone)
                    )
                    row = cur.fetchone()
                except psycopg.errors.UniqueViolation:
                    raise ValueError(f"User with email '{email}' already exists.")

                cur.execute("SELECT role_name FROM roles WHERE role_id = %s", (role_id,))
                role_row = cur.fetchone()
                role_name = role_row["role_name"] if role_row else "user"
                return User(**row, role_name=role_name)

    async def update_user(self, user_id: UUID, full_name: Optional[str] = None, phone: Optional[str] = None) -> Optional[User]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE users
                    SET full_name = COALESCE(%s, full_name),
                        phone = COALESCE(%s, phone),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, email, password_hash, full_name, role_id, phone, is_active, created_at, updated_at
                    """,
                    (full_name, phone, user_id)
                )
                row = cur.fetchone()
                if not row:
                    return None
                cur.execute("SELECT role_name FROM roles WHERE role_id = %s", (row["role_id"],))
                role_row = cur.fetchone()
                return User(**row, role_name=role_row["role_name"] if role_row else "user")
