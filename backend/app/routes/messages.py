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

@router.get('/delete-requests')
def get_delete_requests(current_user: dict = Depends(get_current_user)):
    return MessageService.get_delete_requests(current_user['uid'])

@router.patch('/{user_id}/pin')
def pin_chat(user_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    return MessageService.set_chat_preference(current_user['uid'], user_id, pinned=bool(payload.get('pinned')))

@router.delete('/{user_id}/for-me')
def delete_chat_for_me(user_id: str, current_user: dict = Depends(get_current_user)):
    return MessageService.set_chat_preference(current_user['uid'], user_id, hidden=True)

@router.post('/{user_id}/delete-request')
def request_delete_for_everyone(user_id: str, current_user: dict = Depends(get_current_user)):
    return MessageService.request_delete_for_everyone(current_user['uid'], user_id)

@router.patch('/delete-request/{request_id}')
def handle_delete_request(request_id: str, payload: dict, current_user: dict = Depends(get_current_user)):
    try:
        return MessageService.handle_delete_for_everyone(request_id, current_user['uid'], payload.get('action'))
    except (ValueError, PermissionError) as error:
        raise HTTPException(status_code=400 if isinstance(error, ValueError) else 403, detail=str(error))


@router.get('/search')
def search_contacts(username: str, current_user: dict = Depends(get_current_user)):
    return MessageService.search_contacts(current_user['uid'], username)


@router.get('/access/{user_id}')
def get_message_access(user_id: str, current_user: dict = Depends(get_current_user)):
    return MessageService.get_message_access(current_user['uid'], user_id)


@router.post('/requests/{user_id}')
def create_message_request(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user['uid']:
        raise HTTPException(status_code=400, detail='You cannot message yourself')
    try:
        result = MessageService.create_message_request(current_user['uid'], user_id)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    if not result:
        raise HTTPException(status_code=404, detail='User not found')
    return result


@router.patch('/requests/{request_id}')
def handle_message_request(request_id: str, action: dict, current_user: dict = Depends(get_current_user)):
    try:
        return MessageService.handle_message_request(request_id, current_user['uid'], action.get('action'))
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get('/{user_id}')
def get_messages(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user['uid']:
        raise HTTPException(status_code=400, detail='You cannot message yourself')
    try:
        return MessageService.get_messages(current_user['uid'], user_id)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))


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
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
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