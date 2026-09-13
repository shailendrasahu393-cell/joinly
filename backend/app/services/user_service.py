from datetime import datetime
from ..services.firebase import db
from ..schemas.user import UserCreate, UserUpdate

class UserService:
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
