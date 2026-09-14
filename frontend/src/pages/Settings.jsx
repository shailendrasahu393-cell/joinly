import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { changePassword, logOut, resetPassword } from '../services/auth'
import MobileHeader from '../components/MobileHeader'
import { LogOut, User, Shield, Info, ChevronRight, Edit3, Bell, LockKeyhole, Ban } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { canUseBrowserNotifications, requestBrowserNotificationPermission } from '../utils/notifications'

export default function Settings() {
    const { userProfile } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()
    const [notificationPermission, setNotificationPermission] = useState('unsupported')
    const [showAccount, setShowAccount] = useState(false)
    const [passwords, setPasswords] = useState({ current: '', next: '' })
    const [passwordLoading, setPasswordLoading] = useState(false)

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

    const handleChangePassword = async (event) => {
        event.preventDefault()
        if (passwords.next.length < 6) return toast.error('New password must be at least 6 characters.')
        setPasswordLoading(true)
        try {
            await changePassword(passwords.current, passwords.next)
            setPasswords({ current: '', next: '' })
            setShowAccount(false)
            toast.success('Password changed successfully.')
        } catch (error) {
            toast.error(error.code === 'auth/invalid-credential' ? 'Current password is incorrect.' : error.message || 'Unable to change password.')
        } finally { setPasswordLoading(false) }
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
                    <SettingRow icon={User} title="Account Details" onClick={() => setShowAccount(true)} />
                    <SettingRow icon={Shield} title="Privacy & Safety" onClick={() => navigate('/blocked-users')} />
                    <SettingRow icon={Ban} title="Blocked Users" onClick={() => navigate('/blocked-users')} />
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
            <Modal isOpen={showAccount} onClose={() => setShowAccount(false)} title="Account Details">
                <div style={{ display: 'grid', gap: 20 }}>
                    <div><div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Email</div><strong>{userProfile?.email || 'Unavailable'}</strong></div>
                    <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><LockKeyhole size={18} /> Password</div>
                        <input className="input-field" type="password" required placeholder="Current password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} />
                        <input className="input-field" type="password" required minLength={6} placeholder="New password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} />
                        <button className="btn btn-primary" disabled={passwordLoading}>{passwordLoading ? 'Changing...' : 'Change Password'}</button>
                    </form>
                    <button className="btn btn-secondary" onClick={async () => { try { await resetPassword(userProfile?.email); toast.success('Password reset email sent.') } catch { toast.error('Unable to send reset email.') } }}>Forgot Password</button>
                </div>
            </Modal>
        </div>
    )
}
