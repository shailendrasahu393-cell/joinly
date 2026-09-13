import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, ArrowLeft, MapPin, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useUnreadMessages from '../hooks/useUnreadMessages'

export default function MobileHeader({ title, showBack, showCity }) {
    const navigate = useNavigate()
    const location = useLocation()
    const { userProfile } = useAuth()
    const unreadCount = useUnreadMessages()

    const isHome = location.pathname === '/home'

    return (
        <header className="mobile-header">
            <div className="mh-left">
                {showBack ? (
                    <button onClick={() => navigate(-1)} className="mh-icon-btn" aria-label="Go back">
                        <ArrowLeft size={22} />
                    </button>
                ) : isHome ? (
                    <div>
                        <div className="mh-logo">JOINLY</div>
                        {(showCity !== false) && userProfile?.city && (
                            <div className="mh-city">
                                <MapPin size={12} />
                                {userProfile.city}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mh-title">{title}</div>
                )}
            </div>
            <div className="mh-right">
                <button onClick={() => navigate('/notifications')} className="mh-icon-btn" aria-label="Notifications">
                    <Bell size={20} />
                </button>
                <button onClick={() => navigate('/messages')} className="mh-icon-btn" aria-label="Messages">
                  <MessageCircle size={20} />
                  {unreadCount > 0 && <span className="mh-unread-dot" aria-label={`${unreadCount} unread messages`} />}
                </button>
            </div>

            <style>{`
        .mobile-header {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          padding: 0 16px;
          padding-top: env(safe-area-inset-top, 0px);
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border-light);
        }

        .mh-left { display: flex; align-items: center; gap: 8px; }
        .mh-right { display: flex; align-items: center; gap: 4px; }

        .mh-logo {
          font-size: 20px;
          font-weight: 800;
          color: var(--color-primary);
          letter-spacing: 0;
        }

        .mh-city {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 12px;
          color: var(--color-text-secondary);
          margin-top: -2px;
        }

        .mh-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--color-text);
        }

        .mh-icon-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px; height: 40px;
          border-radius: var(--radius-full);
          border: none;
          background: none;
          color: var(--color-text);
          cursor: pointer;
          transition: background 0.2s;
        }

        .mh-icon-btn:hover { background: var(--color-bg-secondary); }
        .mh-unread-dot { position: absolute; top: 7px; right: 7px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-danger); border: 2px solid white; }

        @media (min-width: 1024px) {
          .mobile-header { display: none; }
        }
      `}</style>
        </header>
    )
}
