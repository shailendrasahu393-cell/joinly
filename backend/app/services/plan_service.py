import uuid
from datetime import datetime
from typing import List, Optional
from ..services.firebase import db
from ..schemas.plan import PlanCreate, PlanUpdate
from ..services.user_service import UserService
from ..services.notification_service import NotificationService

class PlanService:
    @staticmethod
    def _enrich_plan(plan_data: dict, current_uid: Optional[str] = None):
        if not plan_data: return None
        
        # Enrich with host data (in NoSQL we might denormalize this, but for MVP we fetch it)
        host = UserService.get_user(plan_data.get("hostId"))
        if host:
            plan_data["host"] = {
                "id": host.get("id"),
                "fullName": host.get("fullName"),
                "username": host.get("username"),
                "profileImage": host.get("profileImage"),
                "age": host.get("age"),
                "gender": host.get("gender")
            }
            
        # Enrich with user request status if requested
        if current_uid and db is not None:
            reqs = db.collection('join_requests') \
                .where('planId', '==', plan_data["id"]) \
                .where('requesterId', '==', current_uid) \
                .limit(1).stream()
                
            for req in reqs:
                status = req.to_dict().get("status")
                plan_data["userRequestStatus"] = {
                    "accept": "accepted",
                    "decline": "declined"
                }.get(status, status)
                break
                
        return plan_data

    @staticmethod
    def create_plan(host_id: str, plan_data: PlanCreate):
        if db is None: return None
        
        plan_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        plan_dict = {
            "id": plan_id,
            "hostId": host_id,
            **plan_data.model_dump(),
            "status": "active",
            "participantCount": 0,
            "createdAt": now,
            "updatedAt": now
        }
        
        db.collection('plans').document(plan_id).set(plan_dict)
        return plan_dict

    @staticmethod
    def get_plan(plan_id: str, current_uid: Optional[str] = None):
        if db is None: return None
        doc = db.collection('plans').document(plan_id).get()
        if not doc.exists: return None
        return PlanService._enrich_plan(doc.to_dict(), current_uid)

    @staticmethod
    def update_plan(plan_id: str, host_id: str, plan_update: PlanUpdate):
        if db is None: return None
        
        doc_ref = db.collection('plans').document(plan_id)
        doc = doc_ref.get()
        
        if not doc.exists: return None
        if doc.to_dict().get("hostId") != host_id:
            raise Exception("Unauthorized: Only the host can edit the plan")
            
        update_data = plan_update.model_dump(exclude_unset=True)
        update_data['updatedAt'] = datetime.utcnow()
        doc_ref.update(update_data)
        
        return doc_ref.get().to_dict()

    @staticmethod
    def delete_plan(plan_id: str, host_id: str):
        if db is None: return False

        doc_ref = db.collection('plans').document(plan_id)
        doc = doc_ref.get()

        if not doc.exists: return False
        if doc.to_dict().get("hostId") != host_id:
            raise Exception("Unauthorized: Only the host can delete the plan")

        NotificationService.delete_for_plan(plan_id)
        doc_ref.delete()
        return True

    @staticmethod
    def search_plans(category: str = None, city: str = None, q: str = None, host_id: str = None, current_uid: str = None):
        if db is None: return []
        
        query = db.collection('plans')
        
        # Firestore querying limitations apply here.
        # For MVP, we do basic filtering and then sort in memory.
        if host_id:
            query = query.where('hostId', '==', host_id)
        else:
            query = query.where('status', 'in', ['active', 'closed'])
            
        if city:
            query = query.where('city', '==', city)
        if category:
            query = query.where('category', '==', category)
            
        docs = query.stream()
        results = [doc.to_dict() for doc in docs]
        
        # Simple text search fallback for MVP
        if q:
            q_lower = q.lower()
            results = [r for r in results if q_lower in r.get('title', '').lower() or 
                       q_lower in r.get('description', '').lower() or
                       q_lower in r.get('locationName', '').lower() or
                       q_lower in r.get('area', '').lower()]
                       
        # Sort by recently created (safest memory sort for small result sets)
        results.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        # Enrich and enforce privacy blocks (future)
        return [PlanService._enrich_plan(r, current_uid) for r in results]
