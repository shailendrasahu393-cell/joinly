from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..dependencies.auth import get_current_user
from ..schemas.plan import PlanCreate, PlanUpdate
from ..services.plan_service import PlanService

router = APIRouter()

@router.post("")
def create_plan(plan: PlanCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["uid"]
    new_plan = PlanService.create_plan(user_id, plan)
    if not new_plan:
        raise HTTPException(status_code=500, detail="Database not configured")
    return new_plan

@router.get("/{plan_id}")
def get_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("uid")
    plan = PlanService.get_plan(plan_id, user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@router.patch("/{plan_id}")
def update_plan(plan_id: str, plan_update: PlanUpdate, current_user: dict = Depends(get_current_user)):
    try:
        updated = PlanService.update_plan(plan_id, current_user["uid"], plan_update)
        if not updated:
            raise HTTPException(status_code=404, detail="Plan not found")
        return updated
    except Exception as e:
        if "Unauthorized" in str(e):
            raise HTTPException(status_code=403, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{plan_id}")
def delete_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
    try:
        deleted = PlanService.delete_plan(plan_id, current_user["uid"])
        if not deleted:
            raise HTTPException(status_code=404, detail="Plan not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        if "Unauthorized" in str(e):
            raise HTTPException(status_code=403, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
def search_plans(
    category: Optional[str] = None,
    city: Optional[str] = None,
    q: Optional[str] = None,
    host_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user) # Optional in a real app if discovery without login is allowed
):
    plans = PlanService.search_plans(
        category=category,
        city=city,
        q=q,
        host_id=host_id,
        current_uid=current_user.get("uid")
    )
    return plans

from ..services.join_request_service import JoinRequestService

@router.post("/{plan_id}/join")
def request_join(plan_id: str, current_user: dict = Depends(get_current_user)):
    try:
        req = JoinRequestService.create_request(plan_id, current_user["uid"])
        if not req:
            raise HTTPException(status_code=500, detail="Database not configured")
        return req
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{plan_id}/requests")
def get_plan_requests(plan_id: str, current_user: dict = Depends(get_current_user)):
    return JoinRequestService.get_plan_requests(plan_id, current_user["uid"])

