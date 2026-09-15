from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import random
from datetime import datetime, timezone, timedelta
import firebase_admin
from firebase_admin import auth as firebase_auth
from ..dependencies.auth import get_current_user
from ..services.firebase import db
from ..services.email_service import send_otp_email

router = APIRouter()

class SendOtpRequest(BaseModel):
    email: str

class VerifyOtpRequest(BaseModel):
    email: str
    password: str
    otp: str

@router.get("/me")
def get_auth_status(current_user: dict = Depends(get_current_user)):
    return {"status": "authenticated", "uid": current_user["uid"]}

@router.post("/send-signup-otp")
def send_signup_otp(req: SendOtpRequest):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Check if user already exists in Firebase Auth
    try:
        firebase_auth.get_user_by_email(req.email)
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    except firebase_admin.auth.UserNotFoundError:
        pass # User doesn't exist, we can proceed
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Error checking user: {e}")
        pass

    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Save OTP to Firestore
    db.collection("signup_otps").document(req.email).set({
        "otp": otp,
        "expires_at": expires_at
    })
    
    # Send email
    success = send_otp_email(req.email, otp)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again.")
        
    return {"message": "OTP sent successfully"}

@router.post("/verify-signup-otp")
def verify_signup_otp(req: VerifyOtpRequest):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
        
    doc_ref = db.collection("signup_otps").document(req.email)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=400, detail="No OTP requested or it has expired.")
        
    data = doc.to_dict()
    
    if data["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")
        
    expires_at = data.get("expires_at")
    if not expires_at or datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
    # Valid OTP, create user in Firebase Auth
    try:
        user = firebase_auth.create_user(
            email=req.email,
            password=req.password,
            email_verified=True
        )
        
        # Clean up the OTP
        doc_ref.delete()
        
        return {"message": "User created successfully", "uid": user.uid}
    except firebase_admin.exceptions.AlreadyExistsError:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    except Exception as e:
        # Sometimes it raises firebase_admin.auth.EmailAlreadyExistsError
        if "EMAIL_EXISTS" in str(e):
             raise HTTPException(status_code=400, detail="An account with this email already exists.")
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user account.")
