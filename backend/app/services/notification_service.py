import uuid
from datetime import datetime
from ..services.firebase import db
from ..services.user_service import UserService

class NotificationService:
    @staticmethod
    def create_notification(user_id: str, notif_type: str, title: str, message: str, related_plan_id: str = None, related_user_id: str = None):
        if db is None: return None
        
        notif_id = str(uuid.uuid4())
        notif = {
            "id": notif_id,
            "userId": user_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "relatedPlanId": related_plan_id,
            "relatedUserId": related_user_id,
            "read": False,
            "createdAt": datetime.utcnow()
        }
        db.collection('notifications').document(notif_id).set(notif)
        return notif

    @staticmethod
    def get_user_notifications(user_id: str):
        if db is None: return []
        docs = db.collection('notifications') \
            .where('userId', '==', user_id) \
            .stream()
            
        results = [d.to_dict() for d in docs]
        results.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        # Enrich with user image
        for r in results:
            if r.get('relatedUserId'):
                u = UserService.get_user(r['relatedUserId'])
                if u: r['relatedUserImage'] = u.get('profileImage')
                
        return results

    @staticmethod
    def mark_read(notif_id: str, user_id: str):
        if db is None: return False
        doc_ref = db.collection('notifications').document(notif_id)
        doc = doc_ref.get()
        if not doc.exists or doc.to_dict().get('userId') != user_id:
            return False
        doc_ref.update({"read": True})
        return True

    @staticmethod
    def get_unread_count(user_id: str):
        if db is None: return 0
        docs = db.collection('notifications').where('userId', '==', user_id).stream()
        return sum(1 for doc in docs if not doc.to_dict().get('read', False))
