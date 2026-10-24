from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status

from app.config import get_settings
from app.deps import get_current_user, verify_csrf_protection
from app.repositories.base import User
from app.schemas.auth import AuthMeResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
auth_service = AuthService()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    try:
        user = await auth_service.register(
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            role_id=req.role_id,
            phone=req.phone,
        )
        return UserResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role_name,
            role_id=user.role_id,
            phone=user.phone,
            is_active=user.is_active,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/login", response_model=UserResponse)
async def login(req: LoginRequest, response: Response):
    try:
        user, raw_token = await auth_service.login(req.email, req.password)
        settings = get_settings()

        response.set_cookie(
            key=settings.SESSION_COOKIE_NAME,
            value=raw_token,
            max_age=settings.SESSION_MAX_AGE_SECONDS,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            path="/",
        )

        return UserResponse(
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role_name,
            role_id=user.role_id,
            phone=user.phone,
            is_active=user.is_active,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/logout", dependencies=[Depends(verify_csrf_protection)])
async def logout(
    response: Response,
    ewaste_session: str = Cookie(None, alias="ewaste_session"),
):
    settings = get_settings()
    if ewaste_session:
        await auth_service.logout(ewaste_session)

    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=AuthMeResponse)
async def get_me(user: User = Depends(get_current_user)):
    return AuthMeResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role_name,
        role_id=user.role_id,
        phone=user.phone,
    )
