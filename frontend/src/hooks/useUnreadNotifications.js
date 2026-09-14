import { useEffect, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function useUnreadNotifications({ mobileOnly = false } = {}) {
    const { currentUser } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (mobileOnly && window.matchMedia('(min-width: 1024px)').matches) {
            setUnreadCount(0)
            return undefined
        }

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

        const handleNotificationsRead = () => loadUnreadCount()
        window.addEventListener('joinly:notifications-read', handleNotificationsRead)

        loadUnreadCount()
        const interval = window.setInterval(loadUnreadCount, 30000)
        return () => {
            active = false
            window.clearInterval(interval)
            window.removeEventListener('joinly:notifications-read', handleNotificationsRead)
        }
    }, [currentUser])

    return unreadCount
}
