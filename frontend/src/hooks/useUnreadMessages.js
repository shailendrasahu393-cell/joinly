import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import api from '../services/api'
import { db, firebaseConfigured } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { showBrowserNotification } from '../utils/notifications'

export default function useUnreadMessages() {
    const { currentUser } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)
    const previousCount = useRef(null)

    useEffect(() => {
        if (!currentUser) {
            setUnreadCount(0)
            previousCount.current = null
            return undefined
        }

        if (firebaseConfigured && db) {
            const conversationsQuery = query(
                collection(db, 'conversations'),
                where('participants', 'array-contains', currentUser.uid),
            )
            return onSnapshot(conversationsQuery, (snapshot) => {
                const count = snapshot.docs.reduce((total, doc) => (
                    total + (doc.data().unreadCounts?.[currentUser.uid] || 0)
                ), 0)
                if (previousCount.current !== null && count > previousCount.current) {
                    showBrowserNotification('New JOINLY message', {
                        body: 'You have a new message.',
                        tag: 'joinly-message',
                    })
                }
                previousCount.current = count
                setUnreadCount(count)
            }, (error) => console.error('Unread message listener failed', error))
        }

        api.get('/messages/unread-count')
            .then((response) => setUnreadCount(response.data?.count || 0))
            .catch(() => setUnreadCount(0))
        return undefined
    }, [currentUser])

    return unreadCount
}
