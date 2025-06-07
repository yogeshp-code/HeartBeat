from fastapi import APIRouter, HTTPException, status, Response, Depends, Cookie
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Optional
from .models import (
    UserLogin, UserCreate, LoginResponse, UserResponse, 
    SessionResponse, MessageResponse
)
from .database import db_service
from .jwt_handler import jwt_handler
from .dependencies import get_current_user, get_current_admin_user

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin, response: Response):
    try:
        user = await db_service.authenticate_user(
            user_credentials.username, 
            user_credentials.password
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        token_data = {
            "sub": user.username,
            "user_id": user.id,
            "role": user.role
        }
        access_token = jwt_handler.create_access_token(token_data)
        if user.role == "monitor":
            max_age = 3600 * 24 * 30
        else:
            max_age = 43200
        
        response.set_cookie(
            key="session_token",
            value=access_token,
            max_age=max_age,
            httponly=True,
            secure=True,
            samesite="lax"
        )
        
        return LoginResponse(
            message="Login successful",
            user=user,
            access_token=access_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    response.delete_cookie(key="session_token")
    return MessageResponse(message="Logout successful")

@router.get("/session", response_model=SessionResponse)
async def get_session(current_user: UserResponse = Depends(get_current_user)):
    return SessionResponse(
        user=current_user,
        expires_at=datetime.utcnow(),
        is_valid=True
    )

@router.post("/create-user", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_admin: UserResponse = Depends(get_current_admin_user)
):
    try:
        user = await db_service.create_user(user_data)
        return user
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"Create user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.get("/health")
async def auth_health_check():
    return {"status": "healthy", "service": "authentication"}
