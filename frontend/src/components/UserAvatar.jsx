export default function UserAvatar({ src, name, size = 40, className = '' }) {
    const initials = name
        ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?'

    if (src) {
        return (
            <img
                src={src}
                alt={name || 'User avatar'}
                className={className}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                }}
            />
        )
    }

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.38,
                fontWeight: 700,
                flexShrink: 0,
            }}
        >
            {initials}
        </div>
    )
}
