import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGoogleAuthErrorMessage, logIn, logInWithGoogle, resetPassword } from '../services/auth'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [showReset, setShowReset] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetLoading, setResetLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const toast = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password) return toast.error('Please fill in all fields.')
        setLoading(true)
        try {
            const result = await logIn(email, password)
            if (result.user && !result.user.emailVerified) {
                toast.info('Please verify your email to continue.')
                navigate('/verify-email')
            } else {
                toast.success('Welcome back!')
                navigate('/home')
            }
        } catch (err) {
            const msg = err.code === 'auth/invalid-credential'
                ? 'Invalid email or password.'
                : err.code === 'auth/too-many-requests'
                    ? 'Too many attempts. Please try again later.'
                    : 'Something went wrong. Please try again.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }


    const handleReset = async (e) => {
        e.preventDefault()
        if (!resetEmail) return toast.error('Enter your email address.')
        setResetLoading(true)
        try {
            await resetPassword(resetEmail)
            toast.success('Password reset email sent.')
            setShowReset(false)
        } catch (err) {
            const msg = err.code === 'auth/user-not-found'
                ? 'No account found with this email.'
                : 'Unable to send reset email. Please try again.'
            toast.error(msg)
        } finally {
            setResetLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            const result = await logInWithGoogle()
            if (result?.redirecting) return
            toast.success('Welcome back!')
            navigate('/home')
        } catch (err) {
            console.error('Google sign-in failed:', err)
            toast.error(getGoogleAuthErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <button className="auth-back" type="button" onClick={() => navigate('/')} aria-label="Back to home" title="Back to home">
                    <ArrowLeft size={20} />
                </button>
                <div className="auth-logo">JOINLY</div>
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Log in to continue your plans</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                        <label>Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 24 }}>
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="input-field"
                                style={{ width: '100%', paddingRight: 44 }}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
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

                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <button
                    type="button"
                    className="btn btn-google btn-block btn-lg"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                >
                    <span className="google-mark">G</span>
                    Continue with Google
                </button>

                <button className="auth-link-button" onClick={() => setShowReset(!showReset)}>
                    Forgot password?
                </button>

                {showReset && (
                    <form className="reset-form" onSubmit={handleReset}>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="Enter your email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            autoComplete="email"
                        />
                        <button type="submit" className="btn btn-outline btn-block" disabled={resetLoading}>
                            {resetLoading ? 'Sending...' : 'Send reset email'}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>

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

                .auth-back {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    padding: 0;
                    border: none;
                    border-radius: var(--radius-full);
                    background: transparent;
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                }

                .auth-back:hover {
                    background: var(--color-surface-hover);
                    color: var(--color-text);
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

        .auth-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: var(--color-text-secondary);
        }

        .auth-footer a {
          color: var(--color-primary);
          font-weight: 600;
          text-decoration: none;
        }

                .auth-link-button {
                    display: block;
                    margin: 16px auto 0;
                    border: none;
                    background: none;
                    color: var(--color-primary);
                    cursor: pointer;
                    font: inherit;
                    font-size: 14px;
                }

                .reset-form {
                    display: grid;
                    gap: 12px;
                    margin-top: 16px;
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 20px 0;
                    color: var(--color-text-tertiary);
                    font-size: 13px;
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    height: 1px;
                    flex: 1;
                    background: var(--color-border);
                }

                .btn-google {
                    background: var(--color-surface);
                    color: var(--color-text);
                    border: 1px solid var(--color-border);
                }

                .btn-google:hover {
                    background: var(--color-surface-hover);
                }

                .google-mark {
                    color: #4285F4;
                    font-weight: 800;
                    font-size: 18px;
                }
      `}</style>
        </div>
    )
}
