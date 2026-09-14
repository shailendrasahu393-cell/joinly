import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, PlusCircle, CalendarDays, User, Bell } from 'lucide-react'
import useUnreadNotifications from '../hooks/useUnreadNotifications'

const NAV_ITEMS = [
    { to: '/home', icon: Home, label: 'Home' },
    { to: '/discover', icon: Search, label: 'Discover' },
    { to: '/create', icon: PlusCircle, label: 'Create', isCreate: true },
    { to: '/my-plans', icon: CalendarDays, label: 'My Plans' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: '/profile', icon: User, label: 'Profile' },
]

export default function MobileBottomNav() {
    const navigate = useNavigate()
  const unreadNotificationCount = useUnreadNotifications()

    return (
        <nav className="mobile-bottom-nav">
            {NAV_ITEMS.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `nav-item ${isActive ? 'active' : ''} ${item.isCreate ? 'create-btn' : ''}`
                    }
                >
                    <span style={{ position: 'relative', display: 'inline-flex' }}>
                      <item.icon size={item.isCreate ? 28 : 22} strokeWidth={item.isCreate ? 2.5 : 2} />
                      {item.to === '/notifications' && unreadNotificationCount > 0 && <span className="mobile-unread-dot" />}
                    </span>
                    <span>{item.label}</span>
                </NavLink>
            ))}

            <style>{`
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-around;
          height: 64px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background: var(--color-surface);
          border-top: 1px solid var(--color-border-light);
          box-shadow: 0 -2px 12px rgba(0,0,0,0.04);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          flex: 1;
          height: 100%;
          min-width: 44px;
          min-height: 44px;
          text-decoration: none;
          color: var(--color-text-tertiary);
          font-size: 10px;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-item.active {
          color: var(--color-primary);
        }

        .nav-item.create-btn {
          color: var(--color-primary);
        }

        .nav-item.create-btn.active {
          color: var(--color-primary-dark);
        }

        .mobile-unread-dot {
          position: absolute;
          top: -2px;
          right: -5px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-danger);
          border: 2px solid var(--color-surface);
        }

        @media (min-width: 1024px) {
          .mobile-bottom-nav { display: none; }
        }
      `}</style>
        </nav>
    )
}
