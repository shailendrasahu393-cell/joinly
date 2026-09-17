import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { reloadUser, sendVerificationEmail, logOut } from '../services/auth'
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react'

export default function VerifyEmail() {
    const { currentUser, refreshAuthState } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)

    const handleCheckVerification = async () => {
        setLoading(true)
        try {
            const freshUser = await reloadUser()
            if (freshUser?.emailVerified) {
                await freshUser.getIdToken(true) // Force refresh ID token for backend
                refreshAuthState(freshUser)
                toast.success('Email verified! Let\'s set up your profile.')
                navigate('/onboarding')
            } else {
                toast.error('Email not verified yet. Please check your inbox and click the verification link.')
            }
        } catch (err) {
            toast.error('Unable to check verification status. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (!currentUser) return
        setResending(true)
        try {
            await sendVerificationEmail(currentUser)
            toast.success('Verification email sent again!')
        } catch (err) {
            if (err.code === 'auth/too-many-requests') {
                toast.error('Too many requests. Please wait a moment and try again.')
            } else {
                toast.error('Failed to resend verification email.')
            }
        } finally {
            setResending(false)
        }
    }

    const handleLogout = async () => {
        await logOut()
        navigate('/')
    }

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ textAlign: 'center' }}>
                <div className="auth-logo">JOINLY</div>

                <div style={{
                    width: 72, height: 72, borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary-light, rgba(108, 92, 231, 0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                }}>
                    <Mail size={32} style={{ color: 'var(--color-primary)' }} />
                </div>

                <h1 className="auth-title">Verify your email</h1>
                <p className="auth-subtitle" style={{ marginBottom: 8 }}>
                    We sent a verification link to
                </p>
                <p style={{
                    fontWeight: 700, fontSize: 15, marginBottom: 28,
                    color: 'var(--color-text)', wordBreak: 'break-all',
                }}>
                    {currentUser?.email}
                </p>

                <p style={{
                    fontSize: 13, color: 'var(--color-text-secondary)',
                    lineHeight: 1.6, marginBottom: 28,
                }}>
                    Click the link in your email to verify your account, then come back here and tap the button below.
                </p>

                <button
                    className="btn btn-primary btn-block btn-lg"
                    onClick={handleCheckVerification}
                    disabled={loading}
                    style={{ marginBottom: 12 }}
                >
                    {loading ? (
                        <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Checking...</>
                    ) : (
                        <><CheckCircle size={16} /> I've verified my email</>
                    )}
                </button>

                <button
                    className="btn btn-secondary btn-block"
                    onClick={handleResend}
                    disabled={resending}
                    style={{ marginBottom: 12 }}
                >
                    {resending ? 'Sending...' : 'Resend verification email'}
                </button>

                <button
                    className="btn btn-outline btn-block"
                    onClick={handleLogout}
                    style={{ color: 'var(--color-text-secondary)' }}
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

                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    )
}
