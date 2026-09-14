import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logOut } from '../services/auth'
import MobileHeader from '../components/MobileHeader'
import { LogOut, User, Shield, Info, ChevronRight, Edit3, Bell } from 'lucide-react'
import { canUseBrowserNotifications, requestBrowserNotificationPermission } from '../utils/notifications'

export default function Settings() {
    const { userProfile } = useAuth()
    const navigate = useNavigate()
    const [notificationPermission, setNotificationPermission] = useState('unsupported')

    useEffect(() => {
        if (canUseBrowserNotifications()) setNotificationPermission(Notification.permission)
    }, [])

    const enableNotifications = async () => {
        const permission = await requestBrowserNotificationPermission()
        setNotificationPermission(permission)
    }

    const handleLogout = async () => {
        await logOut()
        navigate('/')
    }

    const SettingRow = ({ icon: Icon, title, onClick, danger }) => (
        <div
            className="card"
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', padding: '16px', gap: 12,
                cursor: 'pointer', marginBottom: 8, border: '1px solid var(--color-border-light)',
                color: danger ? 'var(--color-danger)' : 'var(--color-text)'
            }}
        >
            <Icon size={20} />
            <div style={{ flex: 1, fontWeight: 600 }}>{title}</div>
            <ChevronRight size={18} style={{ color: 'var(--color-text-tertiary)' }} />
        </div>
    )

    return (
        <div className="page">
            <MobileHeader title="Settings" showBack />

            <div className="page-content">
                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                        Account
                    </div>
                    <SettingRow icon={Edit3} title="Edit Profile" onClick={() => navigate('/profile/edit')} />
                    <SettingRow icon={User} title="Account Details" onClick={() => { }} />
                    <SettingRow icon={Shield} title="Privacy & Safety" onClick={() => navigate('/about#privacy')} />
                    <SettingRow
                        icon={Bell}
                        title={notificationPermission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
                        onClick={enableNotifications}
                    />
                </div>

                <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                        App
                    </div>
                    <SettingRow icon={Info} title="About JOINLY" onClick={() => navigate('/about')} />
                </div>

                <div>
                    <button
                        className="btn btn-outline btn-block"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        onClick={handleLogout}
                    >
                        <LogOut size={18} /> Log out
                    </button>
                    <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                        Logged in as {userProfile?.email}
                    </div>
                </div>
            </div>
        </div>
    )
}
