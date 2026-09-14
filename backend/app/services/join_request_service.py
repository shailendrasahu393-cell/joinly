import uuid
from datetime import datetime
from ..services.firebase import db
from ..services.user_service import UserService
from ..services.plan_service import PlanService
from ..services.notification_service import NotificationService

class JoinRequestService:
    @staticmethod
    def create_request(plan_id: str, requester_id: str):
        if db is None: return None
        
        plan = PlanService.get_plan(plan_id)
        if not plan: raise Exception("Plan not found")
        if plan['hostId'] == requester_id: raise Exception("Host cannot join their own plan")
        
        # Check if full
        if plan.get('participantCount', 0) >= plan.get('maxParticipants', 5):
            raise Exception("Plan is full")
            
        # Check if already requested
        existing = db.collection('join_requests') \
            .where('planId', '==', plan_id) \
            .where('requesterId', '==', requester_id) \
            .limit(1).stream()
            
        for e in existing:
            raise Exception("Request already sent")
            
        req_id = str(uuid.uuid4())
        now = datetime.utcnow()
        req_dict = {
            "id": req_id,
            "planId": plan_id,
            "requesterId": requester_id,
            "hostId": plan["hostId"],
            "status": "pending",
            "createdAt": now,
            "updatedAt": now
        }
        
        db.collection('join_requests').document(req_id).set(req_dict)
        
        # Notify host
        requester = UserService.get_user(requester_id)
        requester_name = requester.get('fullName', 'Someone') if requester else 'Someone'
        NotificationService.create_notification(
            user_id=plan['hostId'],
            notif_type="join_request",
            title="New Join Request!",
            message=f"{requester_name} wants to join your plan '{plan['title']}'",
            related_plan_id=plan_id,
            related_user_id=requester_id
        )
        
        return req_dict

    @staticmethod
    def handle_request(req_id: str, host_id: str, action: str):
        if db is None: return None
        if action not in ["accept", "decline"]: raise Exception("Invalid action")
        
        doc_ref = db.collection('join_requests').document(req_id)
        doc = doc_ref.get()
        if not doc.exists: raise Exception("Request not found")
        
        req_data = doc.to_dict()
        if req_data.get('hostId') != host_id: raise Exception("Unauthorized")
        if req_data.get('status') != 'pending': raise Exception("Request already handled")
        
        plan_id = req_data['planId']
        plan_ref = db.collection('plans').document(plan_id)
        plan_doc = plan_ref.get()
        if not plan_doc.exists: raise Exception("Plan not found")
        
        plan_data = plan_doc.to_dict()
        
        if action == "accept":
            if plan_data.get('participantCount', 0) >= plan_data.get('maxParticipants', 5):
                raise Exception("Plan is already full")
                
            # Transaction ideally, but for MVP consecutive writes
            plan_ref.update({"participantCount": plan_data.get('participantCount', 0) + 1})
            
        now = datetime.utcnow()
        doc_ref.update({"status": action, "updatedAt": now})
        
        # Notification to requester
        status_text = "accepted" if action == "accept" else "declined"
        NotificationService.create_notification(
            user_id=req_data['requesterId'],
            notif_type=f"request_{status_text}",
            title=f"Request {status_text.title()}",
            message=f"Your request to join '{plan_data['title']}' was {status_text}.",
            related_plan_id=plan_id,
            related_user_id=host_id
        )
        
        return {**req_data, "status": action, "updatedAt": now}

    @staticmethod
    def get_plan_requests(plan_id: str, host_id: str):
        if db is None: return []
        
        # Verify ownership
        plan = db.collection('plans').document(plan_id).get()
        if not plan.exists or plan.to_dict().get('hostId') != host_id:
            return []
            
        docs = db.collection('join_requests').where('planId', '==', plan_id).stream()
        results = [d.to_dict() for d in docs]
        
        # Enrich
        for r in results:
            u = UserService.get_user(r['requesterId'])
            if u: r['requester'] = u
            
        return results

    @staticmethod
    def get_my_requests(requester_id: str):
        if db is None: return []
        docs = db.collection('join_requests').where('requesterId', '==', requester_id).stream()
        results = [d.to_dict() for d in docs]
        
        # Enrich with minimal plan details
        for r in results:
            p = db.collection('plans').document(r['planId']).get()
            if p.exists: r['plan'] = p.to_dict()
            
        return results

    @staticmethod
    def get_incoming_requests(host_id: str):
        if db is None: return []

        docs = db.collection('join_requests').where('hostId', '==', host_id).stream()
        results = [d.to_dict() for d in docs]

        for request in results:
            user = UserService.get_user(request.get('requesterId'))
            if user:
                request['requester'] = user
            plan = db.collection('plans').document(request.get('planId')).get()
            if plan.exists:
                request['plan'] = plan.to_dict()

        results.sort(key=lambda item: item.get('createdAt', ''), reverse=True)
        return results
