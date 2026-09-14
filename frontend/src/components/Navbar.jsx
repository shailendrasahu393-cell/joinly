import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, LogOut, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { logOut } from '../services/auth'
import UserAvatar from './UserAvatar'
import useUnreadMessages from '../hooks/useUnreadMessages'
import useUnreadNotifications from '../hooks/useUnreadNotifications'

export default function Navbar() {
    const { currentUser, userProfile } = useAuth()
    const navigate = useNavigate()
    const unreadCount = useUnreadMessages()
    const unreadNotificationCount = useUnreadNotifications()

    const handleLogout = async () => {
        await logOut()
        navigate('/')
    }

    return (
        <nav className="desktop-nav">
            <div className="nav-inner">
                <NavLink to={currentUser ? '/home' : '/'} className="nav-logo">
                    JOINLY
                </NavLink>

                {currentUser ? (
                    <>
                        <div className="nav-links">
                            <NavLink to="/home" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
                            <NavLink to="/discover" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Discover</NavLink>
                            <NavLink to="/create" className="btn btn-primary btn-sm">Create Plan</NavLink>
                            <NavLink to="/my-plans" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>My Plans</NavLink>
                        </div>
                        <div className="nav-actions">
                            <NavLink to="/notifications" className="nav-icon-btn" aria-label="Notifications">
                                <Bell size={20} />
                              {unreadNotificationCount > 0 && <span className="unread-dot" aria-label={`${unreadNotificationCount} unread notifications`} />}
                            </NavLink>
                            <NavLink to="/messages" className="nav-icon-btn" aria-label="Messages">
                              <MessageCircle size={20} />
                              {unreadCount > 0 && <span className="unread-dot" aria-label={`${unreadCount} unread messages`} />}
                            </NavLink>
                            <NavLink to="/profile" className="nav-avatar-link">
                                <UserAvatar src={userProfile?.profileImage} name={userProfile?.fullName} size={32} />
                            </NavLink>
                            <button onClick={handleLogout} className="nav-icon-btn" aria-label="Logout">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="nav-actions">
                        <NavLink to="/login" className="btn btn-ghost btn-sm">Log in</NavLink>
                        <NavLink to="/signup" className="btn btn-primary btn-sm">Sign up</NavLink>
                    </div>
                )}
            </div>

            <style>{`
        .desktop-nav {
          display: none;
        }

        @media (min-width: 1024px) {
          .desktop-nav {
            display: block;
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 100;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--color-border-light);
          }

          .nav-inner {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            height: 64px;
            padding: 0 24px;
            gap: 32px;
          }

          .nav-logo {
            font-size: 22px;
            font-weight: 800;
            color: var(--color-primary);
            text-decoration: none;
            letter-spacing: 0;
          }

          .nav-links {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
          }

          .nav-link {
            padding: 8px 14px;
            font-size: 14px;
            font-weight: 500;
            color: var(--color-text-secondary);
            text-decoration: none;
            border-radius: var(--radius-sm);
            transition: all 0.2s;
          }

          .nav-link:hover { color: var(--color-text); background: var(--color-bg-secondary); }
          .nav-link.active { color: var(--color-primary); font-weight: 600; }

          .nav-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .nav-icon-btn {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px; height: 36px;
            border-radius: var(--radius-full);
            color: var(--color-text-secondary);
            text-decoration: none;
            border: none;
            background: none;
            cursor: pointer;
            transition: all 0.2s;
          }

          .nav-icon-btn:hover { background: var(--color-bg-secondary); color: var(--color-text); }

          .nav-avatar-link { text-decoration: none; }
          .unread-dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-danger); border: 2px solid white; }
        }
      `}</style>
        </nav>
    )
}
