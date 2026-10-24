import sys
from pathlib import Path
import pytest
from httpx import ASGITransport, AsyncClient

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.main import app
from app.repositories.mock.mock_store import get_mock_store


@pytest.fixture(autouse=True)
def reset_mock_data():
    """Resets mock data before each test for clean isolation."""
    get_mock_store().reset()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def admin_client():
    """Logs in as admin and returns authenticated client with session cookie."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@ewaste.org", "password": "AdminPass123!"},
        )
        assert resp.status_code == 200
        yield ac


@pytest.fixture
async def citizen_client():
    """Logs in as citizen Jane and returns authenticated client with session cookie."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "citizen.jane@example.com", "password": "AdminPass123!"},
        )
        assert resp.status_code == 200
        yield ac
