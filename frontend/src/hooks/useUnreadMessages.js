import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import api from '../services/api'
import { db, firebaseConfigured } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

export default function useUnreadMessages() {
    const { currentUser } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!currentUser) {
            setUnreadCount(0)
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
