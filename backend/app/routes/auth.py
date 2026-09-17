from fastapi import APIRouter, Depends
from ..dependencies.auth import get_current_user

router = APIRouter()

@router.get("/me")
def get_auth_status(current_user: dict = Depends(get_current_user)):
    return {"status": "authenticated", "uid": current_user["uid"]}
