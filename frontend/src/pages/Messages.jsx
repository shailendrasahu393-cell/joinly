import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle, Send, ArrowLeft, Trash2, Check, X, Search } from 'lucide-react'
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
    const [searchParams, setSearchParams] = useSearchParams()
    const [conversations, setConversations] = useState([])
    const [messages, setMessages] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [sending, setSending] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [messageAccess, setMessageAccess] = useState({ status: 'none' })
    const [contactSearch, setContactSearch] = useState('')
    const [contactResults, setContactResults] = useState([])
    const [contactSearchLoading, setContactSearchLoading] = useState(false)

    const timestampValue = (value) => {
        if (!value) return 0
        if (typeof value.toMillis === 'function') return value.toMillis()
        return new Date(value).getTime() || 0
    }

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const response = await api.get('/messages')
                const items = response.data || []
                setConversations(items)
                const requestedUserId = searchParams.get('user')
                const requested = items.find((item) => item.participantId === requestedUserId)
                if (requested) {
                    setSelectedUser(requested.participant)
                } else if (requestedUserId) {
                    const profileResponse = await api.get(`/users/id/${requestedUserId}`)
                    setSelectedUser(profileResponse.data)
                }
            } catch (error) {
                console.error('Failed to load conversations', error)
            } finally {
                setLoading(false)
            }
        }
        loadConversations()
        if (!firebaseConfigured || !db || !currentUser) return undefined

        const conversationsQuery = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.uid),
        )
        return onSnapshot(conversationsQuery, (snapshot) => {
            setConversations((current) => snapshot.docs.map((doc) => {
                const data = doc.data()
                const participantId = data.participants?.find((id) => id !== currentUser.uid)
                const existing = current.find((item) => item.participantId === participantId)
                return {
                    id: doc.id,
                    participantId,
                    participant: existing?.participant,
                    lastMessage: data.lastMessage,
                    lastMessageAt: data.lastMessageAt,
                    unreadCount: data.unreadCounts?.[currentUser.uid] || 0,
                }
            }).sort((first, second) => timestampValue(second.lastMessageAt) - timestampValue(first.lastMessageAt)))
        }, (error) => console.error('Conversation realtime listener failed', error))
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
                const response = await api.get(`/messages/${selectedUser.id}`)
                setMessages(response.data || [])
            } catch (error) {
                console.error('Failed to load messages', error)
                setMessages([])
            } finally {
                setMessagesLoading(false)
            }
        }
        loadMessages()
        if (messageAccess.status === 'accepted') {
            api.post(`/messages/${selectedUser.id}/read`).catch(() => {})
        }

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
            setMessages(liveMessages.slice(-100))
            setMessagesLoading(false)
        }, (error) => console.error('Message realtime listener failed', error))
    }, [selectedUser, currentUser])

    const selectConversation = (conversation) => {
        setSelectedUser(conversation.participant)
        setConversations((current) => current.map((item) => (
            item.participantId === conversation.participantId
                ? { ...item, unreadCount: 0 }
                : item
        )))
        setSearchParams({ user: conversation.participantId })
    }

    const sendMessage = async (event) => {
        event.preventDefault()
        if (!text.trim() || !selectedUser || sending) return
        setSending(true)
        try {
            const response = await api.post(`/messages/${selectedUser.id}`, { text: text.trim() })
            setMessages((current) => [...current, response.data])
            setText('')
            setConversations((current) => current.map((conversation) => (
                conversation.participantId === selectedUser.id
                    ? { ...conversation, lastMessage: response.data.text, lastMessageAt: response.data.createdAt }
                    : conversation
            )))
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

    const deleteConversation = async () => {
        if (!selectedUser || deleting) return
        const confirmed = window.confirm('Delete this chat for both users? All messages will be permanently removed.')
        if (!confirmed) return

        setDeleting(true)
        try {
            await api.delete(`/messages/${selectedUser.id}`)
            setConversations((current) => current.filter((conversation) => conversation.participantId !== selectedUser.id))
            setMessages([])
            setSelectedUser(null)
            setSearchParams({})
            toast.success('Chat deleted for both users.')
        } catch (error) {
            console.error('Failed to delete conversation', error)
            toast.error(error.response?.data?.detail || 'Unable to delete chat.')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="page messages-page">
            <MobileHeader title="Messages" />
            <div className="messages-layout">
                <aside className={`conversation-panel ${selectedUser ? 'has-selection' : ''}`}>
                    <div className="messages-heading">
                        <h1>Messages</h1>
                        <MessageCircle size={20} />
                    </div>
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
                        <button
                            key={conversation.id}
                            className={`conversation-item ${selectedUser?.id === conversation.participantId ? 'active' : ''}`}
                            onClick={() => selectConversation(conversation)}
                        >
                            <UserAvatar src={conversation.participant?.profileImage} name={conversation.participant?.fullName} size={44} />
                            <span className="conversation-copy">
                                <strong>{conversation.participant?.fullName || 'JOINLY user'}</strong>
                                <small>@{conversation.participant?.username || 'user'}</small>
                                {conversation.unreadCount > 0 && <span className="new-message-label">New message</span>}
                            </span>
                            {conversation.unreadCount > 0 && <span className="conversation-unread-dot" aria-label="Unread message" />}
                        </button>
                    )) : <EmptyState icon={MessageCircle} title="No conversations yet" message="Find someone in Discover and start a conversation." />}
                </aside>

                <main className={`chat-panel ${selectedUser ? 'open' : ''}`}>
                    {selectedUser ? (
                        <>
                            <header className="chat-header">
                                <button className="chat-back" onClick={() => { setSelectedUser(null); setSearchParams({}) }} aria-label="Back to conversations">
                                    <ArrowLeft size={20} />
                                </button>
                                <UserAvatar src={selectedUser.profileImage} name={selectedUser.fullName} size={38} />
                                <div><strong>{selectedUser.fullName}</strong><span>@{selectedUser.username}</span></div>
                                <button className="delete-chat-button" onClick={deleteConversation} disabled={deleting} aria-label="Delete chat" title="Delete chat for both users">
                                    <Trash2 size={18} />
                                </button>
                            </header>
                            {messageAccess.status === 'accepted' ? (
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
        .messages-heading { display: flex; justify-content: space-between; align-items: center; padding: 0 10px 16px; color: var(--color-primary); }
        .messages-heading h1 { margin: 0; color: var(--color-text); font-size: 22px; }
        .contact-search { display: flex; align-items: center; gap: 8px; margin: 0 4px 12px; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-full); color: var(--color-text-tertiary); }
        .contact-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--color-text); font-size: 13px; }
        .contact-results { display: flex; flex-direction: column; gap: 4px; margin: 0 4px 12px; }
        .contact-result { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px; border: 0; border-radius: var(--radius-sm); background: var(--color-bg-secondary); text-align: left; cursor: pointer; }
        .contact-result span { display: flex; flex-direction: column; min-width: 0; }
        .contact-result small, .search-status { color: var(--color-text-secondary); font-size: 12px; }
        .search-status { padding: 8px; }
        .conversation-item { width: 100%; display: flex; gap: 10px; padding: 12px 10px; border: 0; border-radius: var(--radius-md); background: none; text-align: left; cursor: pointer; }
        .conversation-item:hover, .conversation-item.active { background: var(--color-bg-secondary); }
        .conversation-copy { min-width: 0; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
        .conversation-copy strong { color: var(--color-text); font-size: 14px; }
        .conversation-copy small, .conversation-copy span { color: var(--color-text-secondary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conversation-copy .new-message-label { color: var(--color-primary); font-weight: 700; }
        .conversation-unread-dot { flex: 0 0 9px; width: 9px; height: 9px; border-radius: 50%; background: var(--color-danger); }
        .chat-panel { display: flex; flex-direction: column; min-width: 0; }
        .chat-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid var(--color-border-light); }
        .chat-header div { display: flex; flex-direction: column; }
        .delete-chat-button { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border: 0; border-radius: 50%; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
        .delete-chat-button:hover { color: var(--color-danger, #dc2626); background: var(--color-bg-secondary); }
        .delete-chat-button:disabled { opacity: .5; cursor: not-allowed; }
        .chat-header span { color: var(--color-text-secondary); font-size: 12px; }
        .chat-back { display: none; border: 0; background: none; color: var(--color-text); }
        .chat-messages { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 20px; overflow-y: auto; }
        .message-bubble { max-width: 70%; align-self: flex-start; padding: 10px 14px; border-radius: 16px 16px 16px 4px; background: var(--color-bg-secondary); color: var(--color-text); font-size: 14px; }
        .message-bubble.mine { align-self: flex-end; color: white; background: var(--color-primary); border-radius: 16px 16px 4px 16px; }
        .chat-empty, .chat-placeholder { margin: auto; color: var(--color-text-secondary); text-align: center; }
        .chat-placeholder h2 { color: var(--color-text); margin: 10px 0 4px; }
        .message-request-panel { margin: auto; max-width: 360px; padding: 24px; color: var(--color-text-secondary); text-align: center; }
        .message-request-panel h2 { margin: 12px 0 4px; color: var(--color-text); font-size: 18px; }
        .message-request-panel p { margin: 0 0 16px; font-size: 14px; }
        .message-request-actions { display: flex; justify-content: center; gap: 8px; }
        .chat-composer { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--color-border-light); background: var(--color-surface); }
        .chat-composer input { flex: 1; min-width: 0; height: 46px; border: 1px solid var(--color-border); border-radius: var(--radius-full); padding: 12px 16px; outline: none; }
        .chat-composer button { flex: 0 0 46px; width: 46px; height: 46px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 50%; background: var(--color-primary); color: white; cursor: pointer; }
        .chat-composer button:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 767px) {
          .messages-layout { display: block; min-height: calc(100dvh - 120px); }
          .conversation-panel { border-right: 0; padding: 12px 8px 80px; }
          .conversation-panel.has-selection { display: none; }
          .chat-panel { display: none; min-height: calc(100dvh - 120px); }
          .chat-panel.open { display: flex; padding-bottom: 0; }
          .chat-composer { padding: 12px 16px 16px; }
          .chat-back { display: inline-flex; align-items: center; justify-content: center; }
        }
      `}</style>
        </div>
    )
}
