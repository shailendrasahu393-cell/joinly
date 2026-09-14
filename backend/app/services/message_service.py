import uuid
from datetime import datetime

from ..services.firebase import db
from ..services.user_service import UserService
from ..core.config import settings
from ..services.notification_service import NotificationService


class MessageLimitExceeded(Exception):
    pass


def conversation_id(first_uid: str, second_uid: str):
    return '_'.join(sorted([first_uid, second_uid]))


class MessageService:
    @staticmethod
    def search_contacts(uid: str, username: str):
        if db is None: return []
        query = username.strip().lower()
        if not query: return []

        results = []
        for doc in db.collection('users').stream():
            user = doc.to_dict()
            if user.get('id') == uid or query not in str(user.get('username', '')).lower():
                continue
            if MessageService.get_message_access(uid, user.get('id')).get('status') != 'accepted':
                continue
            user.pop('email', None)
            results.append(user)
        return results[:20]

    @staticmethod
    def get_message_access(uid: str, other_uid: str):
        if db is None: return {'status': 'unavailable'}

        conversation_ref = db.collection('conversations').document(conversation_id(uid, other_uid))
        if conversation_ref.get().exists:
            return {'status': 'accepted'}

        request_ref = db.collection('message_requests').document(conversation_id(uid, other_uid))
        request = request_ref.get()
        if not request.exists:
            return {'status': 'none'}

        data = request.to_dict()
        return {
            'status': data.get('status', 'pending'),
            'requestId': request.id,
            'direction': 'outgoing' if data.get('requesterId') == uid else 'incoming',
        }

    @staticmethod
    def create_message_request(requester_id: str, recipient_id: str):
        if db is None: return None
        if not UserService.get_user(recipient_id): return None

        request_ref = db.collection('message_requests').document(conversation_id(requester_id, recipient_id))
        existing = request_ref.get()
        if existing.exists:
            data = existing.to_dict()
            if data.get('status') == 'accepted':
                return {**data, 'id': existing.id}
            if data.get('status') == 'pending':
                return {**data, 'id': existing.id}

            now = datetime.utcnow()
            request_ref.update({
                'requesterId': requester_id,
                'recipientId': recipient_id,
                'status': 'pending',
                'updatedAt': now,
            })
            request = {**data, 'requesterId': requester_id, 'recipientId': recipient_id,
                       'status': 'pending', 'updatedAt': now, 'id': existing.id}
        else:
            now = datetime.utcnow()
            request = {
                'id': request_ref.id,
                'requesterId': requester_id,
                'recipientId': recipient_id,
                'status': 'pending',
                'createdAt': now,
                'updatedAt': now,
            }
            request_ref.set(request)

        requester = UserService.get_user(requester_id)
        requester_name = requester.get('fullName', 'Someone') if requester else 'Someone'
        NotificationService.create_notification(
            user_id=recipient_id,
            notif_type='message_request',
            title='New message request',
            message=f'{requester_name} wants to chat with you.',
            related_user_id=requester_id,
        )
        return request

    @staticmethod
    def handle_message_request(request_id: str, recipient_id: str, action: str):
        if db is None: return None
        if action not in ['accept', 'decline']:
            raise ValueError('Invalid message request action')

        request_ref = db.collection('message_requests').document(request_id)
        request_doc = request_ref.get()
        if not request_doc.exists:
            raise ValueError('Message request not found')

        request = request_doc.to_dict()
        if request.get('recipientId') != recipient_id:
            raise PermissionError('Only the recipient can handle this request')
        if request.get('status') != 'pending':
            raise ValueError('Message request already handled')

        now = datetime.utcnow()
        request_ref.update({'status': action, 'updatedAt': now})
        if action == 'accept':
            db.collection('conversations').document(
                conversation_id(request['requesterId'], request['recipientId'])
            ).set({
                'participants': [request['requesterId'], request['recipientId']],
                'unreadCounts': {
                    request['requesterId']: 0,
                    request['recipientId']: 0,
                },
                'updatedAt': now,
            }, merge=True)
            NotificationService.create_notification(
                user_id=request['requesterId'],
                notif_type='message_request_accepted',
                title='Message request accepted',
                message='Your message request was accepted.',
                related_user_id=recipient_id,
            )
        else:
            NotificationService.create_notification(
                user_id=request['requesterId'],
                notif_type='message_request_declined',
                title='Message request declined',
                message='Your message request was declined. You can send another request later.',
                related_user_id=recipient_id,
            )
        return {**request, 'status': action, 'updatedAt': now, 'id': request_id}

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

        access = MessageService.get_message_access(uid, other_uid)
        if access.get('status') != 'accepted':
            raise PermissionError('Accept the message request before opening this chat')

        conversation = conversation_id(uid, other_uid)
        docs = db.collection('messages').where('conversationId', '==', conversation).stream()
        messages = [doc.to_dict() for doc in docs]
        messages.sort(key=lambda item: item.get('createdAt') or datetime.min)
        return messages[-settings.MESSAGE_HISTORY_LIMIT:]

    @staticmethod
    def send_message(uid: str, recipient_uid: str, text: str):
        if db is None: return None
        if not UserService.get_user(recipient_uid): return None
        if MessageService.get_message_access(uid, recipient_uid).get('status') != 'accepted':
            raise PermissionError('Accept the message request before sending messages')

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
    def delete_conversation(uid: str, other_uid: str):
        if db is None: return False

        conversation = conversation_id(uid, other_uid)
        conversation_ref = db.collection('conversations').document(conversation)
        deleted = False

        message_docs = list(db.collection('messages').where('conversationId', '==', conversation).stream())
        for start in range(0, len(message_docs), 450):
            batch = db.batch()
            for message_doc in message_docs[start:start + 450]:
                batch.delete(message_doc.reference)
            batch.commit()
            deleted = True

        if conversation_ref.get().exists:
            batch = db.batch()
            batch.delete(conversation_ref)
            batch.commit()
            deleted = True
        return deleted

    @staticmethod
    def get_unread_count(uid: str):
        if db is None: return 0
        total = 0
        docs = db.collection('conversations').where('participants', 'array_contains', uid).stream()
        for doc in docs:
            total += doc.to_dict().get('unreadCounts', {}).get(uid, 0)
        return total