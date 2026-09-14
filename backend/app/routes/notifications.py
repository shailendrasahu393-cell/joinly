from fastapi import APIRouter, Depends
from ..dependencies.auth import get_current_user
from ..services.notification_service import NotificationService

router = APIRouter()

@router.get("")
def get_notifications(current_user: dict = Depends(get_current_user)):
    return NotificationService.get_user_notifications(current_user["uid"])

@router.get("/unread-count")
def get_unread_count(current_user: dict = Depends(get_current_user)):
    return {"count": NotificationService.get_unread_count(current_user["uid"])}

@router.patch("/{notif_id}/read")
def mark_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    success = NotificationService.mark_read(notif_id, current_user["uid"])
    return {"success": success}
