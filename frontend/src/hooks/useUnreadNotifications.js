import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function useUnreadNotifications() {
    const { currentUser } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!currentUser) {
            setUnreadCount(0)
            return undefined
        }

        let active = true
        const loadUnreadCount = async () => {
            try {
                const response = await api.get('/notifications/unread-count')
                if (active) setUnreadCount(response.data?.count || 0)
            } catch {
                if (active) setUnreadCount(0)
            }
        }

        loadUnreadCount()
        const interval = window.setInterval(loadUnreadCount, 30000)
        return () => {
            active = false
            window.clearInterval(interval)
        }
    }, [currentUser])

    return unreadCount
}
