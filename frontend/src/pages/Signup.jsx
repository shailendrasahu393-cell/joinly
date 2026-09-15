import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGoogleAuthErrorMessage, logIn, logInWithGoogle } from '../services/auth'
import { sendSignupOtp, verifySignupOtp } from '../services/api'
import { useToast } from '../context/ToastContext'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function Signup() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [otpStep, setOtpStep] = useState(false)
    const [otp, setOtp] = useState('')
    const navigate = useNavigate()
    const toast = useToast()

    const handleSendOtp = async (e) => {
        e.preventDefault()
        if (!email || !password || !confirm) return toast.error('Please fill in all fields.')
        if (password.length < 6) return toast.error('Password must be at least 6 characters.')
        if (password !== confirm) return toast.error('Passwords do not match.')

        setLoading(true)
        try {
            await sendSignupOtp(email)
            toast.success('Verification code sent to your email!')
            setOtpStep(true)
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to send verification code. Please try again.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }
    
    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        if (!otp || otp.length < 6) return toast.error('Please enter the 6-digit code.')
        
        setLoading(true)
        try {
            await verifySignupOtp(email, password, otp)
            // If verification is successful, log them in
            await logIn(email, password)
            toast.success('Account created! Let\'s set up your profile.')
            navigate('/onboarding')
        } catch (err) {
            const msg = err.response?.data?.detail || 'Invalid verification code or something went wrong.'
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
                <button className="auth-back" type="button" onClick={() => otpStep ? setOtpStep(false) : navigate('/')} aria-label="Back" title="Back">
                    <ArrowLeft size={20} />
                </button>
                <div className="auth-logo">JOINLY</div>
                <h1 className="auth-title">{otpStep ? 'Verify your email' : 'Create your account'}</h1>
                <p className="auth-subtitle">
                    {otpStep ? `We sent a code to ${email}` : 'Join plans around your city'}
                </p>

                {!otpStep ? (
                    <>
                        <form onSubmit={handleSendOtp}>
                            <div className="input-group" style={{ marginBottom: 16 }}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    disabled={loading}
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
                                {loading ? 'Sending code...' : 'Continue'}
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
                    </>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="input-group" style={{ marginBottom: 24 }}>
                            <label>Verification Code</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                autoComplete="one-time-code"
                                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '4px' }}
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading || otp.length < 6}>
                            {loading ? 'Verifying...' : 'Verify & Sign up'}
                        </button>
                        
                        <p className="auth-footer">
                            Didn't receive the code? <button type="button" onClick={handleSendOtp} style={{background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer', font: 'inherit', padding: 0}}>Resend</button>
                        </p>
                    </form>
                )}

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
