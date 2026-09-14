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
    def _normalize_request_status(status):
        return {
            'accept': 'accepted',
            'decline': 'declined',
        }.get(status, status)

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
            if UserService.is_blocked(uid, user.get('id')):
                continue
            if MessageService.get_message_access(uid, user.get('id')).get('status') != 'accepted':
                continue
            user.pop('email', None)
            results.append(user)
        return results[:20]

    @staticmethod
    def get_message_access(uid: str, other_uid: str):
        if db is None: return {'status': 'unavailable'}
        if UserService.is_blocked(uid, other_uid): return {'status': 'blocked'}

        conversation_ref = db.collection('conversations').document(conversation_id(uid, other_uid))
        if conversation_ref.get().exists:
            return {'status': 'accepted'}

        request_ref = db.collection('message_requests').document(conversation_id(uid, other_uid))
        request = request_ref.get()
        if not request.exists:
            return {'status': 'none'}

        data = request.to_dict()
        status = MessageService._normalize_request_status(data.get('status', 'pending'))
        if status == 'accepted':
            conversation_ref.set({
                'participants': [data.get('requesterId'), data.get('recipientId')],
                'unreadCounts': {data.get('requesterId'): 0, data.get('recipientId'): 0},
                'updatedAt': datetime.utcnow(),
            }, merge=True)
        return {
            'status': status,
            'requestId': request.id,
            'direction': 'outgoing' if data.get('requesterId') == uid else 'incoming',
        }

    @staticmethod
    def create_message_request(requester_id: str, recipient_id: str):
        if db is None: return None
        if not UserService.get_user(recipient_id): return None
        if UserService.is_blocked(requester_id, recipient_id):
            raise PermissionError('Messaging is unavailable because one user is blocked')

        request_ref = db.collection('message_requests').document(conversation_id(requester_id, recipient_id))
        existing = request_ref.get()
        if existing.exists:
            data = existing.to_dict()
            if MessageService._normalize_request_status(data.get('status')) == 'accepted':
                return {**data, 'id': existing.id}
            if MessageService._normalize_request_status(data.get('status')) == 'pending':
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
        status = 'accepted' if action == 'accept' else 'declined'
        request_ref.update({'status': status, 'updatedAt': now})
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
        return {**request, 'status': status, 'updatedAt': now, 'id': request_id}

    @staticmethod
    def get_conversations(uid: str):
        if db is None: return []

        docs = db.collection('conversations').where('participants', 'array_contains', uid).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            participant_id = next((item for item in data.get('participants', []) if item != uid), '')
            if UserService.is_blocked(uid, participant_id):
                continue
            preference_doc = db.collection('chat_preferences').document(f'{uid}_{participant_id}').get()
            if preference_doc.exists and preference_doc.to_dict().get('hidden', False):
                continue
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
                'pinned': preference_doc.to_dict().get('pinned', False) if preference_doc.exists else False,
            })
        results.sort(key=lambda item: item.get('lastMessageAt') or datetime.min, reverse=True)
        results.sort(key=lambda item: item.get('pinned', False), reverse=True)
        return results

    @staticmethod
    def set_chat_preference(uid: str, other_uid: str, pinned=None, hidden=None):
        if db is None: return None
        reference = db.collection('chat_preferences').document(f'{uid}_{other_uid}')
        update = {'userId': uid, 'otherUserId': other_uid, 'updatedAt': datetime.utcnow()}
        if pinned is not None: update['pinned'] = pinned
        if hidden is not None: update['hidden'] = hidden
        reference.set(update, merge=True)
        return reference.get().to_dict()

    @staticmethod
    def request_delete_for_everyone(uid: str, other_uid: str):
        if db is None: return None
        request_id = str(uuid.uuid4())
        request = {'id': request_id, 'conversationId': conversation_id(uid, other_uid), 'requesterId': uid, 'recipientId': other_uid, 'status': 'pending', 'createdAt': datetime.utcnow()}
        db.collection('chat_delete_requests').document(request_id).set(request)
        NotificationService.create_notification(other_uid, 'chat_delete_request', 'Delete chat request', 'A chat participant wants to delete your chat for everyone.', related_user_id=uid)
        return request

    @staticmethod
    def get_delete_requests(uid: str):
        if db is None: return []
        results = []
        for doc in db.collection('chat_delete_requests').where('recipientId', '==', uid).where('status', '==', 'pending').stream():
            request = doc.to_dict()
            requester = UserService.get_user(request.get('requesterId'))
            if requester:
                requester.pop('email', None)
                request['requester'] = requester
            results.append(request)
        return results

    @staticmethod
    def handle_delete_for_everyone(request_id: str, uid: str, action: str):
        if db is None: return None
        if action not in ['accept', 'decline']: raise ValueError('Invalid delete request action')
        reference = db.collection('chat_delete_requests').document(request_id)
        doc = reference.get()
        if not doc.exists: raise ValueError('Delete request not found')
        request = doc.to_dict()
        if request.get('recipientId') != uid: raise PermissionError('Only the recipient can handle this request')
        if request.get('status') != 'pending': raise ValueError('Delete request already handled')
        if action == 'accept':
            MessageService._delete_conversation_data(request.get('conversationId'))
        reference.update({'status': action, 'updatedAt': datetime.utcnow()})
        return {**request, 'status': action}

    @staticmethod
    def _delete_conversation_data(conversation):
        if db is None: return
        for collection_name, field_name in [('messages', 'conversationId')]:
            docs = list(db.collection(collection_name).where(field_name, '==', conversation).stream())
            for start in range(0, len(docs), 450):
                batch = db.batch()
                for item in docs[start:start + 450]: batch.delete(item.reference)
                batch.commit()
        db.collection('conversations').document(conversation).delete()

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

        if conversation_ref.get().exists or list(db.collection('messages').where('conversationId', '==', conversation).limit(1).stream()):
            MessageService._delete_conversation_data(conversation)
            deleted = True

        request_ref = db.collection('message_requests').document(conversation)
        if request_ref.get().exists:
            request_ref.delete()
            deleted = True

        notification_docs = db.collection('notifications').where('relatedUserId', '==', other_uid).stream()
        for notification_doc in notification_docs:
            notification = notification_doc.to_dict()
            if notification.get('userId') == uid and notification.get('type', '').startswith('message_request'):
                notification_doc.reference.delete()

        notification_docs = db.collection('notifications').where('relatedUserId', '==', uid).stream()
        for notification_doc in notification_docs:
            notification = notification_doc.to_dict()
            if notification.get('userId') == other_uid and notification.get('type', '').startswith('message_request'):
                notification_doc.reference.delete()

        return deleted

    @staticmethod
    def get_unread_count(uid: str):
        if db is None: return 0
        total = 0
        docs = db.collection('conversations').where('participants', 'array_contains', uid).stream()
        for doc in docs:
            total += doc.to_dict().get('unreadCounts', {}).get(uid, 0)
        return total