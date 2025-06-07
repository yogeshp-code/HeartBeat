import os
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from dotenv import load_dotenv

class JWTHandler:
    def __init__(self):
        load_dotenv()
        self.secret_key = os.getenv("JWT_SECRET", "your-secret-key-change-this")
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 720
    
    def create_access_token(self, data: Dict[str, Any]) -> str:
        # Minimal claims for public repo example
        to_encode = {
            "sub": "example_user_id",
            "role": "user",  # or "monitor"
            "exp": datetime.utcnow() + timedelta(minutes=15),
            "iat": datetime.utcnow(),
            "type": "access"
        }
        encoded_jwt = jwt.encode(to_encode, "your_jwt_secret_placeholder", algorithm=self.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            exp = payload.get("exp")
            if exp and datetime.utcnow() > datetime.fromtimestamp(exp):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired"
                )
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    
    def get_token_expiry(self, token: str) -> Optional[datetime]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            exp = payload.get("exp")
            if exp:
                return datetime.fromtimestamp(exp)
            return None
        except jwt.JWTError:
            return None

jwt_handler = JWTHandler()
