import UserAvatar from './UserAvatar'
import { Check, X } from 'lucide-react'

export default function JoinRequestCard({ request, onAccept, onDecline, showActions = true }) {
    const user = request.requester || {}

    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserAvatar src={user.profileImage} name={user.fullName} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{user.fullName || 'User'}</div>
                {user.username && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>@{user.username}</div>
                )}
                {user.bio && (
                    <div style={{
                        fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                        {user.bio}
                    </div>
                )}
                {request.status === 'accepted' && (
                    <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>✓ Accepted</span>
                )}
                {request.status === 'declined' && (
                    <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>✗ Declined</span>
                )}
            </div>
            {showActions && request.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => onAccept?.(request.id)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '8px 12px' }}
                    >
                        <Check size={16} />
                    </button>
                    <button
                        onClick={() => onDecline?.(request.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '8px 12px' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    )
}
