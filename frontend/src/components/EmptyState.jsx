import { Search as SearchIcon } from 'lucide-react'

export default function EmptyState({ icon: Icon = SearchIcon, title, message, action }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            textAlign: 'center',
        }}>
            <div style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--radius-xl)',
                background: 'var(--color-bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
            }}>
                <Icon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>
                {title}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', maxWidth: 280, lineHeight: 1.5 }}>
                {message}
            </p>
            {action && <div style={{ marginTop: 20 }}>{action}</div>}
        </div>
    )
}
