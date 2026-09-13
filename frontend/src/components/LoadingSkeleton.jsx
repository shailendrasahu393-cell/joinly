export default function LoadingSkeleton({ type = 'card', count = 3 }) {
    if (type === 'card') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="card" style={{ padding: 16 }}>
                        <div className="skeleton" style={{ width: 80, height: 16, marginBottom: 12 }} />
                        <div className="skeleton" style={{ width: '70%', height: 20, marginBottom: 12 }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                            <div className="skeleton" style={{ width: 100, height: 14 }} />
                        </div>
                        <div className="skeleton" style={{ width: '90%', height: 14, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: '60%', height: 14 }} />
                    </div>
                ))}
            </div>
        )
    }

    if (type === 'profile') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 24 }}>
                <div className="skeleton" style={{ width: 96, height: 96, borderRadius: '50%' }} />
                <div className="skeleton" style={{ width: 150, height: 22 }} />
                <div className="skeleton" style={{ width: 100, height: 16 }} />
                <div className="skeleton" style={{ width: '80%', height: 14 }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton" style={{ width: 70, height: 28, borderRadius: 14 }} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: '100%', height: 60, borderRadius: 12 }} />
            ))}
        </div>
    )
}
