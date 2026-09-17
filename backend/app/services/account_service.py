from firebase_admin import auth as firebase_auth
from ..services.firebase import db
import concurrent.futures


class AccountService:
    """Centralized account deletion service.

    Deletes ALL JOINLY-related Firestore data for a given UID,
    then deletes the Firebase Authentication user.
    """

    @staticmethod
    def delete_account(uid: str):
        if db is None:
            raise RuntimeError("Database not configured")

        # Run independent deletion tasks concurrently to speed up the process
        with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
            futures = [
                executor.submit(AccountService._delete_user_plans, uid),
                executor.submit(AccountService._delete_docs_by_field, 'join_requests', 'requesterId', uid),
                executor.submit(AccountService._delete_docs_by_field, 'join_requests', 'hostId', uid),
                executor.submit(AccountService._delete_user_conversations, uid),
                executor.submit(AccountService._delete_user_message_requests, uid),
                executor.submit(AccountService._delete_docs_by_field, 'notifications', 'userId', uid),
                executor.submit(AccountService._delete_docs_by_field, 'notifications', 'relatedUserId', uid),
                executor.submit(AccountService._delete_docs_by_field, 'blocked_users', 'blockerId', uid),
                executor.submit(AccountService._delete_docs_by_field, 'blocked_users', 'blockedId', uid),
                executor.submit(AccountService._delete_docs_by_field, 'chat_preferences', 'userId', uid),
                executor.submit(AccountService._delete_docs_by_field, 'chat_preferences', 'otherUserId', uid),
                executor.submit(AccountService._delete_docs_by_field, 'chat_delete_requests', 'requesterId', uid),
                executor.submit(AccountService._delete_docs_by_field, 'chat_delete_requests', 'recipientId', uid),
            ]
            
            # Wait for all to complete and raise any exceptions
            for future in concurrent.futures.as_completed(futures):
                future.result()

        # 11. Delete message usage tracking
        usage_ref = db.collection('message_usage').document(uid)
        if usage_ref.get().exists:
            usage_ref.delete()

        # 12. Delete the user profile document (releases username)
        user_ref = db.collection('users').document(uid)
        if user_ref.get().exists:
            user_ref.delete()

        # 13. Delete the Firebase Authentication user
        try:
            firebase_auth.delete_user(uid)
        except firebase_auth.UserNotFoundError:
            pass  # Already deleted or never existed

    @staticmethod
    def _delete_user_plans(uid: str):
        """Delete all plans hosted by the user, plus their join requests and notifications."""
        plan_docs = list(
            db.collection('plans').where('hostId', '==', uid).stream()
        )
        for plan_doc in plan_docs:
            plan_id = plan_doc.id
            # Delete join requests for this plan
            AccountService._delete_docs_by_field('join_requests', 'planId', plan_id)
            # Delete notifications for this plan
            AccountService._delete_docs_by_field('notifications', 'relatedPlanId', plan_id)
            # Delete the plan itself
            plan_doc.reference.delete()

    @staticmethod
    def _delete_user_conversations(uid: str):
        """Delete conversations where the user is a participant, plus their messages."""
        conv_docs = list(
            db.collection('conversations')
            .where('participants', 'array_contains', uid)
            .stream()
        )
        for conv_doc in conv_docs:
            conversation_id = conv_doc.id
            # Delete all messages in the conversation
            AccountService._delete_docs_by_field('messages', 'conversationId', conversation_id)
            # Delete the conversation document
            conv_doc.reference.delete()

    @staticmethod
    def _delete_user_message_requests(uid: str):
        """Delete message_requests where the user is involved.

        message_requests use a composite document ID (uid1_uid2 sorted),
        so we scan by requesterId and recipientId fields.
        """
        AccountService._delete_docs_by_field('message_requests', 'requesterId', uid)
        AccountService._delete_docs_by_field('message_requests', 'recipientId', uid)

    @staticmethod
    def _delete_docs_by_field(collection: str, field: str, value: str):
        """Delete all documents in a collection where field == value, using batched writes."""
        docs = list(db.collection(collection).where(field, '==', value).stream())
        for start in range(0, len(docs), 450):
            batch = db.batch()
            for doc in docs[start:start + 450]:
                batch.delete(doc.reference)
            batch.commit()
