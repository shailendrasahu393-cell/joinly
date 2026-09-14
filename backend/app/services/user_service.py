from datetime import datetime
from ..services.firebase import db
from ..schemas.user import UserCreate, UserUpdate

class UserService:
    @staticmethod
    def is_blocked_by(profile_owner_id: str, viewer_id: str):
        if db is None or not profile_owner_id or not viewer_id: return False
        return db.collection('blocked_users').document(f'{profile_owner_id}_{viewer_id}').get().exists

    @staticmethod
    def is_blocked(first_uid: str, second_uid: str):
        if db is None: return False
        for blocker_id, blocked_id in [(first_uid, second_uid), (second_uid, first_uid)]:
            if db.collection('blocked_users').document(f'{blocker_id}_{blocked_id}').get().exists:
                return True
        return False

    @staticmethod
    def block_user(blocker_id: str, blocked_id: str):
        if db is None: return None
        if blocker_id == blocked_id: raise ValueError('You cannot block yourself')
        if not UserService.get_user(blocked_id): raise ValueError('User not found')
        db.collection('blocked_users').document(f'{blocker_id}_{blocked_id}').set({
            'id': f'{blocker_id}_{blocked_id}',
            'blockerId': blocker_id,
            'blockedId': blocked_id,
            'createdAt': datetime.utcnow(),
        })
        return {'blocked': True, 'userId': blocked_id}

    @staticmethod
    def unblock_user(blocker_id: str, blocked_id: str):
        if db is None: return False
        reference = db.collection('blocked_users').document(f'{blocker_id}_{blocked_id}')
        if not reference.get().exists: return False
        reference.delete()
        return True

    @staticmethod
    def get_blocked_users(blocker_id: str):
        if db is None: return []
        results = []
        for doc in db.collection('blocked_users').where('blockerId', '==', blocker_id).stream():
            data = doc.to_dict()
            user = UserService.get_user(data.get('blockedId'))
            if user:
                user.pop('email', None)
                results.append(user)
            else:
                doc.reference.delete()
        return results

    @staticmethod
    def get_user(uid: str):
        if db is None: return None # MVP Mock gracefully
        doc = db.collection('users').document(uid).get()
        return doc.to_dict() if doc.exists else None
        
    @staticmethod
    def get_user_by_username(username: str):
        if db is None: return None
        docs = db.collection('users').where('username', '==', username).limit(1).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    @staticmethod
    def search_users(username: str, exclude_uid: str = None):
        if db is None: return []

        query = username.strip().lower()
        if not query: return []

        results = []
        for doc in db.collection('users').stream():
            user = doc.to_dict()
            candidate = str(user.get('username', '')).lower()
            if query in candidate and user.get('id') != exclude_uid:
                if UserService.is_blocked(exclude_uid, user.get('id')):
                    continue
                user.pop('email', None)
                results.append(user)
        return results[:20]

    @staticmethod
    def create_or_update_user(uid: str, email: str, user_data: UserUpdate):
        if db is None: return {"id": uid, "email": email, **user_data.model_dump(exclude_unset=True)}
        
        doc_ref = db.collection('users').document(uid)
        doc = doc_ref.get()
        
        now = datetime.utcnow()
        
        if doc.exists:
            update_data = user_data.model_dump(exclude_unset=True)
            update_data['updatedAt'] = now
            doc_ref.update(update_data)
        else:
            create_data = {
                "id": uid,
                "email": email,
                **user_data.model_dump(),
                "createdAt": now,
                "updatedAt": now
            }
            doc_ref.set(create_data)
            
        return doc_ref.get().to_dict()
