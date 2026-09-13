import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--color-border-light)',
                }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            background: 'var(--color-bg-secondary)',
                            cursor: 'pointer',
                            color: 'var(--color-text-secondary)',
                        }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: 20 }}>
                    {children}
                </div>
            </div>
        </div>
    )
}
