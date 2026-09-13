from fastapi import APIRouter, Depends, HTTPException

from ..dependencies.auth import get_current_user
from ..schemas.message import MessageCreate
from ..services.message_service import MessageLimitExceeded, MessageService

router = APIRouter()


@router.get('')
def get_conversations(current_user: dict = Depends(get_current_user)):
    return MessageService.get_conversations(current_user['uid'])


@router.get('/unread-count')
def get_unread_count(current_user: dict = Depends(get_current_user)):
    return {'count': MessageService.get_unread_count(current_user['uid'])}


@router.get('/{user_id}')
def get_messages(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user['uid']:
        raise HTTPException(status_code=400, detail='You cannot message yourself')
    return MessageService.get_messages(current_user['uid'], user_id)


@router.post('/{user_id}')
def send_message(user_id: str, message: MessageCreate, current_user: dict = Depends(get_current_user)):
    if user_id == current_user['uid']:
        raise HTTPException(status_code=400, detail='You cannot message yourself')
    try:
        result = MessageService.send_message(current_user['uid'], user_id, message.text)
    except MessageLimitExceeded as error:
        raise HTTPException(status_code=429, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))
    if not result:
        raise HTTPException(status_code=404, detail='User not found')
    return result


@router.post('/{user_id}/read')
def mark_messages_read(user_id: str, current_user: dict = Depends(get_current_user)):
    return {'success': MessageService.mark_read(current_user['uid'], user_id)}


@router.delete('/{user_id}')
def delete_conversation(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user['uid']:
        raise HTTPException(status_code=400, detail='You cannot delete a conversation with yourself')
    return {'success': MessageService.delete_conversation(current_user['uid'], user_id)}