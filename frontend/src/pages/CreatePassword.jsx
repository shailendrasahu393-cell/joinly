import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { linkPasswordToAccount, reloadUser, logOut } from '../services/auth'
import { LockKeyhole, Eye, EyeOff, LogOut } from 'lucide-react'

export default function CreatePassword() {
    const { currentUser, refreshAuthState } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password.length < 6) return toast.error('Password must be at least 6 characters.')
        if (password !== confirm) return toast.error('Passwords do not match.')

        setLoading(true)
        try {
            await linkPasswordToAccount(password)
            const freshUser = await reloadUser()
            refreshAuthState(freshUser)
            toast.success('Password created! Let\'s set up your profile.')
            navigate('/onboarding')
        } catch (err) {
            if (err.code === 'auth/credential-already-in-use') {
                toast.error('This email is already linked to another account. Please use a different method to sign in.')
            } else if (err.code === 'auth/provider-already-linked') {
                // Password already linked — refresh and continue
                const freshUser = await reloadUser()
                refreshAuthState(freshUser)
                navigate('/onboarding')
            } else if (err.code === 'auth/weak-password') {
                toast.error('Password must be at least 6 characters.')
            } else if (err.code === 'auth/requires-recent-login') {
                toast.error('Your session has expired. Please log out and sign in again.')
            } else {
                toast.error(err.message || 'Failed to create password. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await logOut()
        navigate('/')
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">JOINLY</div>

                <div style={{
                    width: 72, height: 72, borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light, rgba(108, 92, 231, 0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <LockKeyhole size={32} style={{ color: 'var(--color-primary)' }} />
                </div>

                <h1 className="auth-title">Create a password</h1>
                <p className="auth-subtitle">
                    Set a password for your JOINLY account so you can also log in with email and password.
                </p>

                {currentUser?.email && (
                    <p style={{
                        textAlign: 'center', fontWeight: 600, fontSize: 14,
                        color: 'var(--color-text)', marginBottom: 24,
                    }}>
                        {currentUser.email}
                    </p>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="input-field"
                                style={{ width: '100%', paddingRight: 44 }}
                                placeholder="Min 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)',
                                }}
                                aria-label={showPass ? 'Hide password' : 'Show password'}
                            >
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group" style={{ marginBottom: 24 }}>
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Repeat password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Creating password...' : 'Create Password'}
                    </button>
                </form>

                <button
                    className="btn btn-outline btn-block"
                    onClick={handleLogout}
                    disabled={loading}
                    style={{ marginTop: 16, color: 'var(--color-text-secondary)' }}
                >
                    <LogOut size={16} /> Log out
                </button>

                <style>{`
                    .auth-page {
                        min-height: 100dvh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 24px 16px;
                        background: var(--color-bg-secondary);
                    }

                    .auth-card {
                        position: relative;
                        width: 100%;
                        max-width: 400px;
                        background: var(--color-surface);
                        border-radius: var(--radius-xl);
                        padding: 32px 24px;
                        box-shadow: var(--shadow-lg);
                    }

                    .auth-logo {
                        font-size: 28px;
                        font-weight: 800;
                        color: var(--color-primary);
                        text-align: center;
                        margin-bottom: 24px;
                    }

                    .auth-title {
                        font-size: 24px;
                        font-weight: 800;
                        text-align: center;
                        margin-bottom: 4px;
                    }

                    .auth-subtitle {
                        font-size: 14px;
                        color: var(--color-text-secondary);
                        text-align: center;
                        margin-bottom: 28px;
                    }
                `}</style>
            </div>
        </div>
    )
}
