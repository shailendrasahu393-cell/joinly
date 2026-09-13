import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle, Send, ArrowLeft } from 'lucide-react'
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
                }
            }).sort((first, second) => timestampValue(second.lastMessageAt) - timestampValue(first.lastMessageAt)))
        }, (error) => console.error('Conversation realtime listener failed', error))
    }, [searchParams, currentUser])

    useEffect(() => {
        if (!selectedUser) return undefined
        const loadMessages = async () => {
            setMessagesLoading(true)
            try {
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
        api.post(`/messages/${selectedUser.id}/read`).catch(() => {})

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

    return (
        <div className="page messages-page">
            <MobileHeader title="Messages" />
            <div className="messages-layout">
                <aside className={`conversation-panel ${selectedUser ? 'has-selection' : ''}`}>
                    <div className="messages-heading">
                        <h1>Messages</h1>
                        <MessageCircle size={20} />
                    </div>
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
                                {conversation.lastMessage && <span>{conversation.lastMessage}</span>}
                            </span>
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
                            </header>
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
                    ) : <div className="chat-placeholder"><MessageCircle size={34} /><h2>Your messages</h2><p>Select a conversation or find someone in Discover.</p></div>}
                </main>
            </div>
            <style>{`
        .messages-layout { max-width: 1100px; min-height: calc(100dvh - 56px); margin: 0 auto; display: grid; grid-template-columns: 320px 1fr; background: var(--color-surface); }
        .conversation-panel { border-right: 1px solid var(--color-border-light); padding: 20px 12px; overflow-y: auto; }
        .messages-heading { display: flex; justify-content: space-between; align-items: center; padding: 0 10px 16px; color: var(--color-primary); }
        .messages-heading h1 { margin: 0; color: var(--color-text); font-size: 22px; }
        .conversation-item { width: 100%; display: flex; gap: 10px; padding: 12px 10px; border: 0; border-radius: var(--radius-md); background: none; text-align: left; cursor: pointer; }
        .conversation-item:hover, .conversation-item.active { background: var(--color-bg-secondary); }
        .conversation-copy { min-width: 0; display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
        .conversation-copy strong { color: var(--color-text); font-size: 14px; }
        .conversation-copy small, .conversation-copy span { color: var(--color-text-secondary); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-panel { display: flex; flex-direction: column; min-width: 0; }
        .chat-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid var(--color-border-light); }
        .chat-header div { display: flex; flex-direction: column; }
        .chat-header span { color: var(--color-text-secondary); font-size: 12px; }
        .chat-back { display: none; border: 0; background: none; color: var(--color-text); }
        .chat-messages { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 20px; overflow-y: auto; }
        .message-bubble { max-width: 70%; align-self: flex-start; padding: 10px 14px; border-radius: 16px 16px 16px 4px; background: var(--color-bg-secondary); color: var(--color-text); font-size: 14px; }
        .message-bubble.mine { align-self: flex-end; color: white; background: var(--color-primary); border-radius: 16px 16px 4px 16px; }
        .chat-empty, .chat-placeholder { margin: auto; color: var(--color-text-secondary); text-align: center; }
        .chat-placeholder h2 { color: var(--color-text); margin: 10px 0 4px; }
        .chat-composer { display: flex; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--color-border-light); }
        .chat-composer input { flex: 1; min-width: 0; border: 1px solid var(--color-border); border-radius: var(--radius-full); padding: 12px 16px; outline: none; }
        .chat-composer button { width: 44px; border: 0; border-radius: 50%; background: var(--color-primary); color: white; cursor: pointer; }
        .chat-composer button:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 767px) {
          .messages-layout { display: block; min-height: calc(100dvh - 120px); }
          .conversation-panel { border-right: 0; padding: 12px 8px 80px; }
          .conversation-panel.has-selection { display: none; }
          .chat-panel { display: none; min-height: calc(100dvh - 120px); }
                    .chat-panel.open {
                        display: flex;
                        padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
                    }
          .chat-back { display: inline-flex; align-items: center; justify-content: center; }
        }
      `}</style>
        </div>
    )
}
