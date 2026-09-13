import uuid
from datetime import datetime

from ..services.firebase import db
from ..services.user_service import UserService
from ..core.config import settings


class MessageLimitExceeded(Exception):
    pass


def conversation_id(first_uid: str, second_uid: str):
    return '_'.join(sorted([first_uid, second_uid]))


class MessageService:
    @staticmethod
    def get_conversations(uid: str):
        if db is None: return []

        docs = db.collection('conversations').where('participants', 'array_contains', uid).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            participant_id = next((item for item in data.get('participants', []) if item != uid), '')
            participant = UserService.get_user(participant_id)
            if participant:
                participant.pop('email', None)
            results.append({
                'id': doc.id,
                'participantId': participant_id,
                'participant': participant,
                'lastMessage': data.get('lastMessage'),
                'lastMessageAt': data.get('lastMessageAt'),
                'unreadCount': data.get('unreadCounts', {}).get(uid, 0),
            })
        results.sort(key=lambda item: item.get('lastMessageAt') or datetime.min, reverse=True)
        return results

    @staticmethod
    def get_messages(uid: str, other_uid: str):
        if db is None: return []

        conversation = conversation_id(uid, other_uid)
        docs = db.collection('messages').where('conversationId', '==', conversation).stream()
        messages = [doc.to_dict() for doc in docs]
        messages.sort(key=lambda item: item.get('createdAt') or datetime.min)
        return messages[-settings.MESSAGE_HISTORY_LIMIT:]

    @staticmethod
    def send_message(uid: str, recipient_uid: str, text: str):
        if db is None: return None
        if not UserService.get_user(recipient_uid): return None

        clean_text = text.strip()
        if not clean_text or len(clean_text) > settings.MESSAGE_MAX_LENGTH:
            raise ValueError(f'Message must be between 1 and {settings.MESSAGE_MAX_LENGTH} characters')

        usage_ref = db.collection('message_usage').document(uid)
        usage = usage_ref.get().to_dict() or {}
        today = datetime.utcnow().date().isoformat()
        count = usage.get('count', 0) if usage.get('date') == today else 0
        if count >= settings.MESSAGE_DAILY_LIMIT:
            raise MessageLimitExceeded('Daily message limit reached. Try again tomorrow.')

        now = datetime.utcnow()
        conversation = conversation_id(uid, recipient_uid)
        conversation_ref = db.collection('conversations').document(conversation)
        conversation_data = conversation_ref.get().to_dict() or {}
        unread_counts = conversation_data.get('unreadCounts', {})
        unread_counts[recipient_uid] = unread_counts.get(recipient_uid, 0) + 1
        message_id = str(uuid.uuid4())
        message = {
            'id': message_id,
            'conversationId': conversation,
            'senderId': uid,
            'recipientId': recipient_uid,
            'text': clean_text,
            'createdAt': now,
        }
        db.collection('messages').document(message_id).set(message)
        usage_ref.set({'date': today, 'count': count + 1}, merge=True)
        conversation_ref.set({
            'participants': [uid, recipient_uid],
            'lastMessage': clean_text,
            'lastMessageAt': now,
            'unreadCounts': unread_counts,
        }, merge=True)
        return message

    @staticmethod
    def mark_read(uid: str, other_uid: str):
        if db is None: return False
        conversation_ref = db.collection('conversations').document(conversation_id(uid, other_uid))
        conversation = conversation_ref.get()
        if not conversation.exists: return False
        conversation_ref.set({'unreadCounts': {uid: 0}}, merge=True)
        return True

    @staticmethod
    def get_unread_count(uid: str):
        if db is None: return 0
        total = 0
        docs = db.collection('conversations').where('participants', 'array_contains', uid).stream()
        for doc in docs:
            total += doc.to_dict().get('unreadCounts', {}).get(uid, 0)
        return total