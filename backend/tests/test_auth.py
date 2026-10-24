import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["db_mode"] == "mock"
    assert data["postgres_connected"] is True


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # 1. Register new citizen
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "StrongPassword123!",
            "full_name": "New Citizen",
            "role_id": 2,
            "phone": "+1-555-9999",
        },
    )
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()
    assert user_data["email"] == "newuser@example.com"
    assert user_data["role"] == "user"

    # 2. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@example.com", "password": "StrongPassword123!"},
    )
    assert login_resp.status_code == 200
    assert "ewaste_session" in login_resp.cookies

    # 3. Check /me
    me_resp = await client.get("/api/v1/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "newuser@example.com"

    # 4. Logout
    logout_resp = await client.post(
        "/api/v1/auth/logout",
        headers={"X-Requested-With": "XMLHttpRequest"},
    )
    assert logout_resp.status_code == 200


@pytest.mark.asyncio
async def test_invalid_login(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@ewaste.org", "password": "WrongPassword!"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_duplicate_registration_fails(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@ewaste.org",
            "password": "Password123!",
            "full_name": "Duplicate Admin",
            "role_id": 1,
        },
    )
    assert resp.status_code == 409
