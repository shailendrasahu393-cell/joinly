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
            
        results = []
        for doc in docs:
            notification = doc.to_dict()
            related_user_id = notification.get('relatedUserId')
            related_plan_id = notification.get('relatedPlanId')

            if related_user_id and not db.collection('users').document(related_user_id).get().exists:
                doc.reference.delete()
                continue
            if related_plan_id and not db.collection('plans').document(related_plan_id).get().exists:
                doc.reference.delete()
                continue
            if related_user_id and notification.get('type', '').startswith('message_request'):
                from ..services.message_service import MessageService
                access = MessageService.get_message_access(user_id, related_user_id)
                if access.get('status') == 'none':
                    doc.reference.delete()
                    continue

            results.append(notification)

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
        return sum(
            1 for notification in NotificationService.get_user_notifications(user_id)
            if not notification.get('read', False)
        )

    @staticmethod
    def delete_for_plan(plan_id: str):
        if db is None: return

        references = []
        for collection_name, field_name in [('join_requests', 'planId'), ('notifications', 'relatedPlanId')]:
            references.extend(
                doc.reference
                for doc in db.collection(collection_name).where(field_name, '==', plan_id).stream()
            )

        for start in range(0, len(references), 450):
            batch = db.batch()
            for reference in references[start:start + 450]:
                batch.delete(reference)
            batch.commit()
