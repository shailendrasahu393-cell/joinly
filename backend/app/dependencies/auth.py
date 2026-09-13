from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth
from ..services.firebase import db
from ..core.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Very basic check, in prod we must verify signature
        if settings.ALLOW_DEMO_AUTH and token.startswith("test_token_"):
            uid = token.replace("test_token_", "")
            return {"uid": uid, "email": f"{uid}@example.com"}
        
        # Real Firebase token verification
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Auth error: {e}")
        if settings.ALLOW_DEMO_AUTH and db is None:
            return {"uid": "demo_user_1", "email": "demo@joinly.app"}
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
