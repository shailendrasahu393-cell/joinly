import { formatDate } from '../utils/constants'
import UserAvatar from './UserAvatar'
import { useNavigate } from 'react-router-dom'

export default function NotificationItem({ notification, onClick }) {
    const navigate = useNavigate()
    const isUnread = !notification.read

    const handleClick = () => {
        onClick?.(notification.id)
        if (notification.type?.startsWith('message_request') && notification.relatedUserId) {
            navigate(`/messages?user=${notification.relatedUserId}`)
        } else if (notification.relatedPlanId) {
            navigate(`/plans/${notification.relatedPlanId}`)
        }
    }

    return (
        <div
            className="card"
            onClick={handleClick}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer',
                background: isUnread ? 'color-mix(in srgb, var(--color-primary) 4%, white)' : 'var(--color-surface)',
                borderLeft: isUnread ? '3px solid var(--color-primary)' : '3px solid transparent',
            }}
        >
            <UserAvatar src={notification.relatedUserImage} name={notification.title} size={40} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: isUnread ? 600 : 400, color: 'var(--color-text)', lineHeight: 1.4 }}>
                    {notification.message}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    {formatDate(notification.createdAt)}
                </div>
            </div>
            {isUnread && (
                <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--color-primary)', flexShrink: 0, marginTop: 6,
                }} />
            )}
        </div>
    )
}
