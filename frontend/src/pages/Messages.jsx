import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { MessageCircle, Send, ArrowLeft, Trash2, Check, X, Search, Pin, MoreVertical } from 'lucide-react'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import UserAvatar from '../components/UserAvatar'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { db, firebaseConfigured } from '../services/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

export default function Messages() {
    const { currentUser } = useAuth()
    const toast = useToast()
    const location = useLocation()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [conversations, setConversations] = useState([])
    const [messages, setMessages] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [messageAccess, setMessageAccess] = useState({ status: 'none' })
    const [contactSearch, setContactSearch] = useState('')
    const [contactResults, setContactResults] = useState([])
    const [contactSearchLoading, setContactSearchLoading] = useState(false)
    const [deleteRequests, setDeleteRequests] = useState([])
    const [menuConversation, setMenuConversation] = useState(null)
    const blockedUserIdsRef = useRef([])
    const longPressTimer = useRef(null)
    const longPressTriggered = useRef(false)

    const timestampValue = (value) => {
        if (!value) return 0
        if (typeof value.toMillis === 'function') return value.toMillis()
        return new Date(value).getTime() || 0
    }

    const upsertConversation = (participant, lastMessage = null, lastMessageAt = null) => {
        if (!participant?.id) return
        setConversations((current) => {
            const existing = current.find((conversation) => conversation.participantId === participant.id)
            if (existing) {
                return current.map((conversation) => conversation.participantId === participant.id
                    ? { ...conversation, participant, lastMessage: lastMessage ?? conversation.lastMessage, lastMessageAt: lastMessageAt ?? conversation.lastMessageAt }
                    : conversation)
            }
            return [{
                id: [currentUser.uid, participant.id].sort().join('_'),
                participantId: participant.id,
                participant,
                lastMessage,
                lastMessageAt,
                unreadCount: 0,
                pinned: false,
            }, ...current]
        })
    }

    useEffect(() => {
        const viewport = window.visualViewport
        let layoutHeight = window.innerHeight
        let isKeyboardOpen = false

        const updateViewportHeight = () => {
            const currentHeight = window.innerHeight
            const vvHeight = viewport?.height || window.innerHeight
            
            // Detect if keyboard is open to freeze layout height
            if (currentHeight < layoutHeight - 150 && window.innerWidth === document.documentElement.clientWidth) {
                isKeyboardOpen = true
            } else if (currentHeight >= layoutHeight) {
                isKeyboardOpen = false
                layoutHeight = currentHeight
            } else if (currentHeight < layoutHeight && currentHeight > layoutHeight - 150) {
                if (!isKeyboardOpen) layoutHeight = currentHeight
            }

            if (vvHeight < layoutHeight - 150) {
                isKeyboardOpen = true
            } else if (vvHeight >= layoutHeight - 150 && currentHeight === layoutHeight) {
                isKeyboardOpen = false
            }

            const vvOffset = viewport?.offsetTop || 0

            // Expose exact visual viewport metrics for the fixed chat panel
            document.documentElement.style.setProperty('--joinly-vv-height', `${vvHeight}px`)
            document.documentElement.style.setProperty('--joinly-vv-offset', `${vvOffset}px`)
            document.documentElement.style.setProperty('--joinly-layout-height', `${layoutHeight}px`)

            if (isKeyboardOpen) {
                document.body.classList.add('keyboard-open')
            } else {
                document.body.classList.remove('keyboard-open')
            }
        }
        
        updateViewportHeight()
        viewport?.addEventListener('resize', updateViewportHeight)
        viewport?.addEventListener('scroll', updateViewportHeight)
        window.addEventListener('resize', updateViewportHeight)
        
        // Prevent body scrolling while chat is open
        const preventBodyScroll = () => {
            if (document.querySelector('.chat-panel.open')) {
                document.body.style.overflow = 'hidden'
            } else {
                document.body.style.overflow = ''
            }
        }
        preventBodyScroll()

        return () => {
            document.body.classList.remove('keyboard-open')
            document.body.style.overflow = ''
            viewport?.removeEventListener('resize', updateViewportHeight)
            viewport?.removeEventListener('scroll', updateViewportHeight)
            window.removeEventListener('resize', updateViewportHeight)
        }
    }, [])

    useEffect(() => {
        const closeMenusOnOutsidePress = (event) => {
            if (!event.target.closest('.conversation-menu, .chat-header-menu, .conversation-item, .delete-chat-button')) {
                setMenuConversation(null)
            }
        }

        document.addEventListener('pointerdown', closeMenusOnOutsidePress)
        return () => document.removeEventListener('pointerdown', closeMenusOnOutsidePress)
    }, [])

    useEffect(() => {
        const loadConversations = async () => {
            const requestedUserId = searchParams.get('user')
            try {
                const blockedResponse = await api.get('/users/blocked')
                blockedUserIdsRef.current = (blockedResponse.data || []).map((user) => user.id)
            } catch (error) {
                console.warn('Unable to load blocked users for chat filtering', error)
            }
            try {
                const response = await api.get('/messages')
                const items = response.data || []
                setConversations(items)
                const requested = items.find((item) => item.participantId === requestedUserId)
                if (requested) {
                    setSelectedUser(requested.participant)
                    setMessageAccess({ status: 'accepted' })
                }
            } catch (error) {
                console.error('Failed to load conversations', error)
            } finally {
                setLoading(false)
            }
            try {
                const response = await api.get('/messages/delete-requests')
                setDeleteRequests(response.data || [])
            } catch (error) {
                console.error('Failed to load chat delete requests', error)
            }

            if (requestedUserId) {
                try {
                    const profileResponse = await api.get(`/users/id/${requestedUserId}`)
                    setSelectedUser((current) => current || profileResponse.data)
                } catch (error) {
                    const fallbackUser = location.state?.notificationUser
                    if (fallbackUser?.id === requestedUserId) {
                        setSelectedUser((current) => current || fallbackUser)
                    } else {
                        console.error('Failed to load notification user', error)
                    }
                }
            }
        }
        loadConversations()
        if (!firebaseConfigured || !db || !currentUser) return undefined

        const conversationsQuery = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.uid),
        )
        const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
            setConversations((current) => {
                if (snapshot.empty && current.length > 0) return current
                return snapshot.docs.map((doc) => {
                const data = doc.data()
                const participantId = data.participants?.find((id) => id !== currentUser.uid)
                const existing = current.find((item) => item.participantId === participantId)
                if (blockedUserIdsRef.current.includes(participantId)) return null
                return {
                    id: doc.id,
                    participantId,
                    participant: existing?.participant,
                    lastMessage: data.lastMessage,
                    lastMessageAt: data.lastMessageAt,
                    unreadCount: data.unreadCounts?.[currentUser.uid] || 0,
                    pinned: existing?.pinned || false,
                }
                }).filter(Boolean).sort((first, second) => timestampValue(second.lastMessageAt) - timestampValue(first.lastMessageAt))
            })
        }, (error) => console.error('Conversation realtime listener failed', error))
        const blockedQuery = query(collection(db, 'blocked_users'), where('blockerId', '==', currentUser.uid))
        const unsubscribeBlocks = onSnapshot(blockedQuery, (snapshot) => {
            const nextIds = snapshot.docs.map((doc) => doc.data().blockedId)
            blockedUserIdsRef.current = nextIds
            setConversations((current) => current.filter((conversation) => !nextIds.includes(conversation.participantId)))
        }, (error) => console.warn('Blocked users realtime listener unavailable; API fallback remains active', error))
        return () => {
            unsubscribeConversations()
            unsubscribeBlocks()
        }
    }, [searchParams, currentUser])

    useEffect(() => {
        const query = contactSearch.trim()
        if (!query) {
            setContactResults([])
            return undefined
        }

        const timer = window.setTimeout(async () => {
            setContactSearchLoading(true)
            try {
                const response = await api.get('/messages/search', { params: { username: query } })
                setContactResults(response.data || [])
            } catch {
                setContactResults([])
            } finally {
                setContactSearchLoading(false)
            }
        }, 300)
        return () => window.clearTimeout(timer)
    }, [contactSearch])

    useEffect(() => {
        if (!selectedUser) return undefined
        const loadMessages = async () => {
            setMessagesLoading(true)
            try {
                const accessResponse = await api.get(`/messages/access/${selectedUser.id}`)
                const access = accessResponse.data || { status: 'none' }
                setMessageAccess(access)
                if (access.status !== 'accepted') {
                    setMessages([])
                    return
                }
                api.post(`/messages/${selectedUser.id}/read`).catch(() => {})
                const response = await api.get(`/messages/${selectedUser.id}`)
                setMessageAccess((current) => ({ ...current, status: 'accepted' }))
                setMessages(response.data || [])
                upsertConversation(
                    selectedUser,
                    response.data?.[response.data.length - 1]?.text || null,
                    response.data?.[response.data.length - 1]?.createdAt || null,
                )
            } catch (error) {
                console.error('Failed to load messages', error)
                setMessages([])
            } finally {
                setMessagesLoading(false)
            }
        }
        loadMessages()
        if (!firebaseConfigured || !db || !currentUser) return undefined

        const conversation = [currentUser.uid, selectedUser.id].sort().join('_')
        const messagesQuery = query(
            collection(db, 'messages'),
            where('conversationId', '==', conversation),
        )
        return onSnapshot(messagesQuery, (snapshot) => {
            const liveMessages = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .sort((first, second) => timestampValue(first.createdAt) - timestampValue(second.createdAt))
            if (liveMessages.length > 0) {
                setMessageAccess((current) => current.status === 'accepted' ? current : { ...current, status: 'accepted' })
            }
            setMessages(liveMessages.slice(-100))
            setMessagesLoading(false)
        }, (error) => console.error('Message realtime listener failed', error))
    }, [selectedUser, currentUser])

    const selectConversation = (conversation) => {
        if (longPressTriggered.current) {
            longPressTriggered.current = false
            return
        }
        setSelectedUser(conversation.participant)
        setMessageAccess({ status: 'accepted' })
        setConversations((current) => current.map((item) => (
            item.participantId === conversation.participantId
                ? { ...item, unreadCount: 0 }
                : item
        )))
        setSearchParams({ user: conversation.participantId })
        setMenuConversation(null)
    }

    const startLongPress = (conversation) => {
        longPressTriggered.current = false
        longPressTimer.current = window.setTimeout(() => {
            longPressTriggered.current = true
            setMenuConversation(conversation.participantId)
        }, 550)
    }

    const cancelLongPress = () => {
        if (longPressTimer.current) window.clearTimeout(longPressTimer.current)
    }

    const deleteForMe = async (participantId) => {
        try {
            await api.delete(`/messages/${participantId}/for-me`)
            setConversations((current) => current.filter((item) => item.participantId !== participantId))
            if (selectedUser?.id === participantId) {
                setSelectedUser(null)
                setSearchParams({})
            }
            toast.success('Chat deleted for you.')
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Unable to delete chat.')
        }
        setMenuConversation(null)
    }

    const requestDeleteForEveryone = async (participantId) => {
        try {
            await api.post(`/messages/${participantId}/delete-request`)
            toast.success('Delete request sent.')
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Unable to send delete request.')
        }
        setMenuConversation(null)
    }

    const togglePin = async (conversation) => {
        try {
            await api.patch(`/messages/${conversation.participantId}/pin`, { pinned: !conversation.pinned })
            setConversations((current) => current.map((item) => item.participantId === conversation.participantId ? { ...item, pinned: !conversation.pinned } : item).sort((first, second) => Number(second.pinned) - Number(first.pinned)))
        } catch {
            toast.error('Unable to update chat pin.')
        }
        setMenuConversation(null)
    }

    const handleDeleteRequest = async (requestId, action) => {
        try {
            await api.patch(`/messages/delete-request/${requestId}`, { action })
            setDeleteRequests((current) => current.filter((request) => request.id !== requestId))
            if (action === 'accept') {
                setMessages([])
                setConversations((current) => current.filter((conversation) => conversation.participantId !== selectedUser?.id))
                setSelectedUser(null)
                setSearchParams({})
                toast.success('Chat deleted for everyone.')
            } else {
                toast.info('Delete request declined.')
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Unable to update delete request.')
        }
    }

    const sendMessage = async (event) => {
        event.preventDefault()
        if (!text.trim() || !selectedUser || sending) return
        setSending(true)
        try {
            const response = await api.post(`/messages/${selectedUser.id}`, { text: text.trim() })
            setMessages((current) => [...current, response.data])
            setText('')
            upsertConversation(selectedUser, response.data.text, response.data.createdAt)
        } catch (error) {
            console.error('Failed to send message', error)
            toast.error(error.response?.status === 429
                ? 'Daily message limit reached. Try again tomorrow.'
                : error.response?.data?.detail || 'Unable to send message.')
        } finally {
            setSending(false)
        }
    }

    const sendMessageRequest = async () => {
        try {
            const response = await api.post(`/messages/requests/${selectedUser.id}`)
            setMessageAccess({ ...response.data, status: 'pending', direction: 'outgoing' })
            toast.success('Message request sent.')
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Unable to send message request.')
        }
    }

    const handleMessageRequest = async (action) => {
        try {
            await api.patch(`/messages/requests/${messageAccess.requestId}`, { action })
            if (action === 'accept') {
                setMessageAccess({ status: 'accepted' })
                const response = await api.get(`/messages/${selectedUser.id}`)
                setMessages(response.data || [])
                setConversations((current) => current.some((item) => item.participantId === selectedUser.id)
                    ? current
                    : [{
                        id: [currentUser.uid, selectedUser.id].sort().join('_'),
                        participantId: selectedUser.id,
                        participant: selectedUser,
                        unreadCount: 0,
                    }, ...current]
                )
                toast.success('Message request accepted.')
            } else {
                setMessageAccess((current) => ({ ...current, status: 'declined' }))
                toast.info('Message request declined.')
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Unable to update message request.')
        }
    }

    const chatIsAccepted = messageAccess.status === 'accepted' || messages.length > 0

    return (
        <div className="page messages-page">
            <MobileHeader title="Messages" />
            <div className="messages-layout">
                <aside className={`conversation-panel ${selectedUser ? 'has-selection' : ''}`}>
                    <div className="contact-search">
                        <Search size={16} />
                        <input
                            value={contactSearch}
                            onChange={(event) => setContactSearch(event.target.value)}
                            placeholder="Search accepted contacts..."
                            aria-label="Search accepted contacts"
                        />
                    </div>
                    {contactSearch && (
                        <div className="contact-results">
                            {contactSearchLoading ? <span className="search-status">Searching...</span> : contactResults.length ? contactResults.map((person) => (
                                <button key={person.id} className="contact-result" onClick={() => {
                                    setContactSearch('')
                                    setSelectedUser(person)
                                    setSearchParams({ user: person.id })
                                }}>
                                    <UserAvatar src={person.profileImage} name={person.fullName} size={32} />
                                    <span><strong>{person.fullName}</strong><small>@{person.username}</small></span>
                                </button>
                            )) : <span className="search-status">No accepted contacts found.</span>}
                        </div>
                    )}
                    {loading ? <LoadingSkeleton type="list" count={4} /> : conversations.length ? conversations.map((conversation) => (
                        <div key={conversation.id} className="conversation-wrapper">
                            <button
                                className={`conversation-item ${selectedUser?.id === conversation.participantId ? 'active' : ''}`}
                                onClick={() => selectConversation(conversation)}
                                onContextMenu={(event) => { event.preventDefault(); setMenuConversation(conversation.participantId) }}
                                onPointerDown={() => startLongPress(conversation)}
                                onPointerUp={cancelLongPress}
                                onPointerCancel={cancelLongPress}
                                onPointerLeave={cancelLongPress}
                            >
                                <UserAvatar src={conversation.participant?.profileImage} name={conversation.participant?.fullName} size={44} />
                                <span className="conversation-copy">
                                    <strong>{conversation.participant?.fullName || 'JOINLY user'}</strong>
                                    <small>@{conversation.participant?.username || 'user'}</small>
                                    {conversation.unreadCount > 0 && <span className="new-message-label">New message</span>}
                                </span>
                                {conversation.pinned && <Pin size={14} className="conversation-pin" />}
                                {conversation.unreadCount > 0 && <span className="conversation-unread-dot" aria-label="Unread message" />}
                            </button>
                            {menuConversation === conversation.participantId && <div className="conversation-menu">
                                <button onClick={() => deleteForMe(conversation.participantId)}><Trash2 size={15} /> Delete Chat for Me</button>
                                <button onClick={() => requestDeleteForEveryone(conversation.participantId)}><Trash2 size={15} /> Delete Chat for Everyone</button>
                                <button onClick={() => togglePin(conversation)}><Pin size={15} /> {conversation.pinned ? 'Unpin Chat' : 'Pin Chat'}</button>
                            </div>}
                        </div>
                    )) : <EmptyState icon={MessageCircle} title="No conversations yet" message="Find someone in Discover and start a conversation." />}
                </aside>

                <main className={`chat-panel ${selectedUser ? 'open' : ''}`}>
                    {selectedUser ? (
                        <>
                            <header className="chat-header">
                                <button className="chat-back" onClick={() => { setSelectedUser(null); setSearchParams({}) }} aria-label="Back to conversations">
                                    <ArrowLeft size={20} />
                                </button>
                                <button className="chat-user-link" onClick={() => selectedUser.username && !selectedUser.blocked && navigate(`/profile/${selectedUser.username}`)} disabled={!selectedUser.username || selectedUser.blocked}>
                                    <UserAvatar src={selectedUser.profileImage} name={selectedUser.fullName} size={38} />
                                    <span><strong>{selectedUser.fullName}</strong><small>@{selectedUser.username}</small></span>
                                </button>
                                <button className="delete-chat-button" onClick={() => setMenuConversation((current) => current === selectedUser.id ? null : selectedUser.id)} aria-label="Chat options" title="Chat options">
                                    <MoreVertical size={20} />
                                </button>
                                {menuConversation === selectedUser.id && <div className="chat-header-menu">
                                    <button onClick={() => deleteForMe(selectedUser.id)}><Trash2 size={15} /> Delete Chat for Me</button>
                                    <button onClick={() => requestDeleteForEveryone(selectedUser.id)}><Trash2 size={15} /> Delete Chat for Everyone</button>
                                    <button onClick={() => togglePin(conversations.find((item) => item.participantId === selectedUser.id) || { participantId: selectedUser.id, pinned: false })}><Pin size={15} /> {conversations.find((item) => item.participantId === selectedUser.id)?.pinned ? 'Unpin Chat' : 'Pin Chat'}</button>
                                </div>}
                            </header>
                            {selectedUser && deleteRequests.some((request) => request.requesterId === selectedUser.id) ? (
                                (() => {
                                    const request = deleteRequests.find((item) => item.requesterId === selectedUser.id)
                                    return <div className="message-request-panel"><Trash2 size={32} /><h2>Delete chat for everyone?</h2><p>{selectedUser.fullName} requested to delete this chat for both users.</p><div className="message-request-actions"><button className="btn btn-primary btn-sm" onClick={() => handleDeleteRequest(request.id, 'accept')}><Check size={16} /> Accept</button><button className="btn btn-secondary btn-sm" onClick={() => handleDeleteRequest(request.id, 'decline')}><X size={16} /> Decline</button></div></div>
                                })()
                            ) : messageAccess.status === 'blocked' ? (
                                <div className="message-request-panel"><h2>JOINLY_user</h2></div>
                            ) : chatIsAccepted ? (
                                <>
                                    <div className="chat-messages">
                                        {messagesLoading ? <LoadingSkeleton type="list" count={4} /> : messages.length ? messages.map((message) => (
                                            <div key={message.id} className={`message-bubble ${message.senderId === currentUser?.uid ? 'mine' : ''}`}>
                                                {message.text}
                                            </div>
                                        )) : <p className="chat-empty">Start the conversation.</p>}
                                    </div>
                                    <form className="chat-composer" onSubmit={sendMessage}>
                                        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message..." maxLength={2000} />
                                        <button type="submit" disabled={sending || !text.trim()} aria-label="Send message"><Send size={18} /></button>
                                    </form>
                                </>
                            ) : (
                                <div className="message-request-panel">
                                    <MessageCircle size={32} />
                                    {messageAccess.status === 'pending' && messageAccess.direction === 'incoming' ? (
                                        <>
                                            <h2>New message request</h2>
                                            <p>{selectedUser.fullName} wants to chat with you.</p>
                                            <div className="message-request-actions">
                                                <button className="btn btn-primary btn-sm" onClick={() => handleMessageRequest('accept')}><Check size={16} /> Accept</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleMessageRequest('decline')}><X size={16} /> Decline</button>
                                            </div>
                                        </>
                                    ) : messageAccess.status === 'pending' ? (
                                        <>
                                            <h2>Message request sent</h2>
                                            <p>Wait for {selectedUser.fullName} to accept before chatting.</p>
                                        </>
                                    ) : messageAccess.status === 'declined' ? (
                                        <>
                                            <h2>Message request declined</h2>
                                            <p>You cannot start a chat with this user right now.</p>
                                            <button className="btn btn-primary" onClick={sendMessageRequest}>Send request again</button>
                                        </>
                                    ) : (
                                        <>
                                            <h2>Start a conversation</h2>
                                            <p>Send a message request before chatting with {selectedUser.fullName}.</p>
                                            <button className="btn btn-primary" onClick={sendMessageRequest}>Send message request</button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    ) : <div className="chat-placeholder"><MessageCircle size={34} /><h2>Your messages</h2><p>Select a conversation or find someone in Discover.</p></div>}
                </main>
            </div>
            <style>{`
        .messages-layout { max-width: 1100px; min-height: calc(100dvh - 56px); margin: 0 auto; display: grid; grid-template-columns: 320px 1fr; background: var(--color-surface); }
        .conversation-panel { border-right: 1px solid var(--color-border-light); padding: 20px 12px; overflow-y: auto; }
        .contact-search { display: flex; align-items: center; gap: 8px; margin: 0 4px 12px; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-full); color: var(--color-text-tertiary); }
        .contact-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--color-text); font-size: 13px; }
        .contact-results { display: flex; flex-direction: column; gap: 4px; margin: 0 4px 12px; }
        .contact-result { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px; border: 0; border-radius: var(--radius-sm); background: var(--color-bg-secondary); text-align: left; cursor: pointer; }
        .contact-result span { display: flex; flex-direction: column; min-width: 0; }
        .contact-result small, .search-status { color: var(--color-text-secondary); font-size: 12px; }
        .search-status { padding: 8px; }
        .conversation-item { width: 100%; display: flex; gap: 10px; padding: 12px 10px; border: 0; border-radius: var(--radius-md); background: none; text-align: left; cursor: pointer; }
        .conversation-item:hover, .conversation-item.active { background: var(--color-bg-secondary); }
        .conversation-wrapper { position: relative; }
        .conversation-menu { position: absolute; top: 8px; right: 8px; z-index: 10; display: grid; min-width: 190px; padding: 6px; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-surface); box-shadow: 0 8px 24px rgba(0,0,0,.14); }
        .conversation-menu button { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--color-text); text-align: left; cursor: pointer; }
        .conversation-menu button:hover { background: var(--color-bg-secondary); }
        .conversation-pin { flex: 0 0 auto; color: var(--color-primary); }
        .conversation-copy { min-width: 0; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
        .conversation-copy strong { color: var(--color-text); font-size: 14px; }
        .conversation-copy small, .conversation-copy span { color: var(--color-text-secondary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conversation-copy .new-message-label { color: var(--color-primary); font-weight: 700; }
        .conversation-unread-dot { flex: 0 0 9px; width: 9px; height: 9px; border-radius: 50%; background: var(--color-danger); }
        .chat-panel { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
        .chat-header { position: relative; flex: 0 0 auto; display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid var(--color-border-light); background: var(--color-surface); z-index: 5; }
        .chat-header div { display: flex; flex-direction: column; }
        .chat-user-link { display: inline-flex; align-items: center; gap: 10px; min-width: 0; padding: 0; border: 0; background: transparent; color: var(--color-text); text-align: left; cursor: pointer; }
        .chat-user-link:disabled { cursor: default; }
        .chat-user-link span { display: flex; flex-direction: column; min-width: 0; }
        .delete-chat-button { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 0; border-radius: 50%; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
        .delete-chat-button:hover { color: var(--color-danger, #dc2626); background: var(--color-bg-secondary); }
        .delete-chat-button:disabled { opacity: .5; cursor: not-allowed; }
        .chat-header-menu { position: absolute; top: calc(100% - 4px); right: 16px; z-index: 20; display: grid; min-width: 210px; padding: 6px; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-surface); box-shadow: 0 8px 24px rgba(0,0,0,.14); }
        .chat-header-menu button { display: flex; align-items: center; gap: 8px; padding: 10px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--color-text); text-align: left; cursor: pointer; }
        .chat-header-menu button:hover { background: var(--color-bg-secondary); }
        .chat-header span { color: var(--color-text-secondary); font-size: 12px; }
        .chat-back { display: none; border: 0; background: none; color: var(--color-text); }
        .chat-messages { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; gap: 8px; padding: 20px; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
        .message-bubble { max-width: 70%; align-self: flex-start; padding: 10px 14px; border-radius: 16px 16px 16px 4px; background: var(--color-bg-secondary); color: var(--color-text); font-size: 14px; }
        .message-bubble.mine { align-self: flex-end; color: white; background: var(--color-primary); border-radius: 16px 16px 4px 16px; }
        .chat-empty, .chat-placeholder { margin: auto; color: var(--color-text-secondary); text-align: center; }
        .chat-placeholder h2 { color: var(--color-text); margin: 10px 0 4px; }
        .message-request-panel { margin: auto; max-width: 360px; padding: 24px; color: var(--color-text-secondary); text-align: center; }
        .message-request-panel h2 { margin: 12px 0 4px; color: var(--color-text); font-size: 18px; }
        .message-request-panel p { margin: 0 0 16px; font-size: 14px; }
        .message-request-actions { display: flex; justify-content: center; gap: 8px; }
        .chat-composer { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; padding: 14px 20px; padding-bottom: calc(14px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid var(--color-border-light); background: var(--color-surface); }
        .chat-composer input { flex: 1; min-width: 0; height: 46px; border: 1px solid var(--color-border); border-radius: var(--radius-full); padding: 12px 16px; outline: none; }
        .chat-composer button { flex: 0 0 46px; width: 46px; height: 46px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: var(--color-primary); color: white; cursor: pointer; }
        .chat-composer button:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 767px) {
            body.keyboard-open .mobile-bottom-nav { display: none !important; }
            body.keyboard-open .messages-layout { height: calc(var(--joinly-layout-height, 100dvh) - 56px - env(safe-area-inset-bottom, 0px)) !important; }
            .messages-page { height: var(--joinly-layout-height, 100dvh); min-height: var(--joinly-layout-height, 100dvh); overflow: hidden; overscroll-behavior: none; }
            .messages-layout { display: block; height: calc(var(--joinly-layout-height, 100dvh) - 56px - 64px - env(safe-area-inset-bottom, 0px)); min-height: 0; overflow: hidden; position: relative; }
            .conversation-panel { border-right: 0; padding: 12px 12px 80px; }
            .contact-search { margin: 0 0 12px; }
            .conversation-panel.has-selection { display: none; }
            .chat-panel { display: none; }
            .chat-panel.open { 
                display: flex; 
                flex-direction: column;
                position: fixed; 
                top: var(--joinly-vv-offset, 0px); 
                left: 0; 
                right: 0; 
                height: var(--joinly-vv-height, 100dvh); 
                z-index: 100;
                background: var(--color-surface);
                padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
            }
            body.keyboard-open .chat-panel.open {
                padding-bottom: 0;
            }
            .chat-header { 
                position: relative; 
                flex: 0 0 auto; 
                z-index: 50; 
                padding: 10px 12px; 
                min-height: 58px; 
            }
            .chat-messages { 
                flex: 1 1 auto; 
                min-height: 0; 
                padding: 14px 12px; 
                overflow-y: auto; 
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
            }
            .chat-composer { 
                position: relative; 
                flex: 0 0 auto; 
                padding: 10px 12px; 
                z-index: 20; 
            }
            body.keyboard-open .chat-composer {
                padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
            }
            .chat-back { display: inline-flex; align-items: center; justify-content: center; }
        }
      `}</style>
        </div>
    )
}
