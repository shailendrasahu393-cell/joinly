from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from ..dependencies.auth import get_current_user
from ..schemas.user import UserUpdate, User
from ..services.user_service import UserService
from ..services.account_service import AccountService

router = APIRouter()

@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    user = UserService.get_user(current_user["uid"])
    if not user:
        # Initial empty state before they complete onboarding
        return {"id": current_user["uid"], "email": current_user.get("email", "")}
    return user

@router.get("/search")
def search_users(username: str, current_user: dict = Depends(get_current_user)):
    return UserService.search_users(username, current_user["uid"])

@router.get("/blocked")
def get_blocked_users(current_user: dict = Depends(get_current_user)):
    return UserService.get_blocked_users(current_user["uid"])

@router.post("/blocked/{user_id}")
def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return UserService.block_user(current_user["uid"], user_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

@router.delete("/blocked/{user_id}")
def unblock_user(user_id: str, current_user: dict = Depends(get_current_user)):
    return {"success": UserService.unblock_user(current_user["uid"], user_id)}

@router.get("/id/{user_id}")
def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_user)):
    user = UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if UserService.is_blocked_by(user_id, current_user["uid"]):
        return {"id": user_id, "username": "JOINLY_user", "fullName": "JOINLY_user", "blocked": True}
    user.pop("email", None)
    return user

@router.patch("/me")
def update_my_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    # Block unverified email/password users from completing onboarding
    sign_in_provider = current_user.get("firebase", {}).get("sign_in_provider", "")
    if sign_in_provider == "password" and not current_user.get("email_verified", False):
        raise HTTPException(status_code=403, detail="Please verify your email before completing your profile.")

    if user_update.dateOfBirth is not None and not UserService.is_at_least_17(user_update.dateOfBirth):
        raise HTTPException(status_code=400, detail="You must be at least 17 years old to complete your profile")

    # Check username uniqueness if they are updating it
    if user_update.username:
        existing = UserService.get_user_by_username(user_update.username)
        if existing and existing.get("id") != current_user["uid"]:
            raise HTTPException(status_code=400, detail="Username is already taken")
            
    updated = UserService.create_or_update_user(
        current_user["uid"], 
        current_user.get("email", ""), 
        user_update
    )
    return updated

@router.get("/{username}")
def get_user_profile(username: str, current_user: dict = Depends(get_current_user)):
    user = UserService.get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if UserService.is_blocked_by(user.get("id"), current_user["uid"]):
        return {"id": user.get("id"), "username": "JOINLY_user", "fullName": "JOINLY_user", "blocked": True}
    
    # Strip private info from public profile
    user.pop("email", None)
    return user

@router.post("/me/profile-image")
def upload_profile_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # In a full implementation, we upload to Firebase Storage Bucket
    # bucket.blob(f"profiles/{current_user['uid']}/{file.filename}").upload_from_file(...)
    
    # Using a placeholder implementation for the MVP backend
    mock_url = f"https://ui-avatars.com/api/?name={current_user['email']}&background=random"
    
    # Update firestore with the url
    UserService.create_or_update_user(current_user["uid"], current_user.get("email", ""), UserUpdate(profileImage=mock_url))
    
    return {"profileImage": mock_url}

@router.delete("/me/account")
def delete_my_account(current_user: dict = Depends(get_current_user)):
    """Delete the current user's account and ALL associated JOINLY data."""
    uid = current_user["uid"]
    try:
        AccountService.delete_account(uid)
        return {"success": True}
    except Exception as e:
        print(f"Account deletion error for {uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete account. Please try again.")
