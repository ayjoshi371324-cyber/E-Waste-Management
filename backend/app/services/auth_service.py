from datetime import datetime, timedelta
from typing import Optional, Tuple
from uuid import UUID
import bcrypt

from app.config import get_settings
from app.deps import generate_session_token, hash_session_token
from app.repositories.base import Session, User
from app.repositories.factory import get_repos


def hash_password(password: str) -> str:
    """Hashes a password with bcrypt ($2b$)."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


class AuthService:
    def __init__(self):
        self.repos = get_repos()
        self.settings = get_settings()

    async def register(self, email: str, password: str, full_name: str, role_id: int = 2, phone: Optional[str] = None) -> User:
        # Check existing user
        existing = await self.repos.users.get_by_email(email)
        if existing:
            raise ValueError("An account with this email address already exists.")

        pw_hash = hash_password(password)
        return await self.repos.users.create_user(
            email=email,
            password_hash=pw_hash,
            full_name=full_name,
            role_id=role_id,
            phone=phone,
        )

    async def login(self, email: str, password: str) -> Tuple[User, str]:
        """
        Authenticates user credentials and returns (User, raw_session_token).
        """
        user = await self.repos.users.get_by_email(email)
        if not user or not user.is_active:
            raise ValueError("Invalid email or password.")

        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password.")

        # Create session
        raw_token = generate_session_token()
        hashed_token = hash_session_token(raw_token)
        expires_at = datetime.utcnow() + timedelta(seconds=self.settings.SESSION_MAX_AGE_SECONDS)

        await self.repos.sessions.create_session(
            session_id=hashed_token,
            user_id=user.id,
            session_data={"email": user.email, "role": user.role_name},
            expires_at=expires_at,
        )

        return user, raw_token

    async def logout(self, raw_session_token: str) -> bool:
        hashed_token = hash_session_token(raw_session_token)
        return await self.repos.sessions.delete_session(hashed_token)
