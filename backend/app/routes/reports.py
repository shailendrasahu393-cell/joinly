from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ReportCreate(BaseModel):
    reportedUserId: str
    reason: str
    description: str

@router.post("/report")
def report_user(report: ReportCreate):
    # In a full app, we save to DB and notify admins
    # For MVP, just acknowledge
    return {"message": "Report logged successfully. We take safety seriously.", "success": True}
