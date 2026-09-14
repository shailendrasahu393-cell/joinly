import { useState, useEffect } from 'react'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import NotificationItem from '../components/NotificationItem'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import { Bell } from 'lucide-react'

export default function Notifications() {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadNotifications()
    }, [])

    const loadNotifications = async () => {
        try {
            const res = await api.get('/notifications')
            setNotifications(res.data || [])
        } catch (err) {
            console.error('Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }

    const handleRead = async (id) => {
        // Optimistically update frontend
        const notif = notifications.find(n => n.id === id)
        if (!notif || notif.read) return

        setNotifications((current) => current.map(n => n.id === id ? { ...n, read: true } : n))

        // Update backend (fire and forget)
        api.patch(`/notifications/${id}/read`)
            .then(() => window.dispatchEvent(new Event('joinly:notifications-read')))
            .catch(console.error)
    }

    return (
        <div className="page">
            <MobileHeader title="Notifications" showBack />

            <div className="page-content">
                {loading ? (
                    <LoadingSkeleton type="list" count={5} />
                ) : notifications.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {notifications.map((notif) => (
                            <NotificationItem
                                key={notif.id}
                                notification={notif}
                                onClick={handleRead}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Bell}
                        title="You're all caught up"
                        message="We'll notify you when someone requests to join your plans or when your requests are accepted."
                    />
                )}
            </div>
        </div>
    )
}
