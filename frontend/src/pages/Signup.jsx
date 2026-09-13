import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGoogleAuthErrorMessage, signUp, logInWithGoogle } from '../services/auth'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const toast = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password || !confirm) return toast.error('Please fill in all fields.')
        if (password.length < 6) return toast.error('Password must be at least 6 characters.')
        if (password !== confirm) return toast.error('Passwords do not match.')

        setLoading(true)
        try {
            await signUp(email, password)
            toast.success('Account created! Let\'s set up your profile.')
            navigate('/onboarding')
        } catch (err) {
            const msg = err.code === 'auth/email-already-in-use'
                ? 'An account with this email already exists.'
                : err.code === 'auth/weak-password'
                    ? 'Password is too weak.'
                    : 'Something went wrong. Please try again.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            const result = await logInWithGoogle()
            if (result?.redirecting) return
            toast.success('Welcome to JOINLY!')
            navigate('/onboarding')
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
                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Join plans around your city</p>

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
                                placeholder="Min 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
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
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Creating account...' : 'Sign up'}
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

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>

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
        </div>
    )
}
