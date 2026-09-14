from fastapi import APIRouter, Depends, HTTPException
from ..dependencies.auth import get_current_user
from ..schemas.join_request import JoinRequestAction
from ..services.join_request_service import JoinRequestService
from ..services.plan_service import PlanService

router = APIRouter()

@router.patch("/{req_id}")
def handle_request(req_id: str, action_data: JoinRequestAction, current_user: dict = Depends(get_current_user)):
    try:
        updated = JoinRequestService.handle_request(req_id, current_user["uid"], action_data.action)
        if not updated:
            raise HTTPException(status_code=500, detail="Database not configured")
        return updated
    except Exception as e:
        status_code = 403 if "Unauthorized" in str(e) else 400
        raise HTTPException(status_code=status_code, detail=str(e))

@router.get("/me")
def get_my_requests(current_user: dict = Depends(get_current_user)):
    return JoinRequestService.get_my_requests(current_user["uid"])

@router.get("/incoming")
def get_incoming_requests(current_user: dict = Depends(get_current_user)):
    return JoinRequestService.get_incoming_requests(current_user["uid"])

# Temporary route to fetch "Joined" and "Created" for the MyPlans view
@router.get("/my-plans")
def get_my_plans_temp(type: str = "joined", current_user: dict = Depends(get_current_user)):
    uid = current_user["uid"]
    if type == "created":
        return PlanService.search_plans(host_id=uid)
        
    elif type == "joined":
        # First get accepted requests
        from ..services.firebase import db
        if db is None: return []
        docs = db.collection('join_requests').where('requesterId', '==', uid).stream()
        plan_ids = [
            data.get("planId")
            for doc in docs
            for data in [doc.to_dict()]
            if data.get("status") == "accepted"
        ]
        if not plan_ids: return []
        
        # In MVP, fetching individually to avoid "in" clauses larger than config permits
        plans = []
        for pid in plan_ids:
            p = PlanService.get_plan(pid, uid)
            if p: plans.append(p)
        return plans
    return []
