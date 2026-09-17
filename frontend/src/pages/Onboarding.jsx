import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { auth } from '../services/firebase'
import { INTEREST_OPTIONS, GENDER_OPTIONS } from '../utils/constants'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import AvatarPicker from '../components/AvatarPicker'

const STEPS = ['basics', 'about', 'interests', 'photo']

export default function Onboarding() {
    const navigate = useNavigate()
    const { refreshProfile } = useAuth()
    const toast = useToast()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        fullName: '', username: '', dateOfBirth: '', gender: '', profileImage: '',
        bio: '', city: 'Kanpur', area: '', interests: [],
    })

    // Force refresh token on mount to ensure backend knows email is verified
    useEffect(() => {
        const refreshToken = async () => {
            const user = auth?.currentUser
            if (user) {
                try {
                    await user.getIdToken(true)
                } catch (e) {
                    console.error("Failed to refresh token", e)
                }
            }
        }
        refreshToken()
    }, [])

    const maxBirthDate = (() => {
        const date = new Date()
        date.setFullYear(date.getFullYear() - 17)
        return date.toISOString().split('T')[0]
    })()

    const update = (k, v) => setForm({ ...form, [k]: v })

    const toggleInterest = (interest) => {
        setForm({
            ...form,
            interests: form.interests.includes(interest)
                ? form.interests.filter((i) => i !== interest)
                : [...form.interests, interest],
        })
    }

    const handleSubmit = async () => {
        if (!form.fullName || !form.username) return toast.error('Name and username are required.')
        if (!form.dateOfBirth) return toast.error('Date of birth is required.')
        if (form.dateOfBirth > maxBirthDate) return toast.error('You must be at least 17 years old.')
        if (form.username.length < 3) return toast.error('Username must be at least 3 characters.')

        setLoading(true)
        try {
            await api.patch('/users/me', form)

            await refreshProfile()
            toast.success('Profile set up!')
            navigate('/home')
        } catch (err) {
            const msg = err.response?.data?.detail || 'Something went wrong.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    const canNext = () => {
        if (step === 0) return form.fullName && form.username && form.dateOfBirth
        if (step === 1) return true
        if (step === 2) return form.interests.length > 0
        return true
    }

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 440 }}>
                <div className="auth-logo">JOINLY</div>

                {/* Progress */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
                            transition: 'background 0.3s',
                        }} />
                    ))}
                </div>

                {step === 0 && (
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Let's get started</h2>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Tell us about yourself</p>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Full Name *</label>
                            <input className="input-field" placeholder="Your full name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Username *</label>
                            <input className="input-field" placeholder="e.g. rahul23" value={form.username} onChange={(e) => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Date of Birth *</label>
                            <input type="date" max={maxBirthDate} className="input-field" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Gender</label>
                            <select className="input-field" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                                <option value="">Select gender</option>
                                {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>About you</h2>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Add a short bio and your location</p>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Bio</label>
                            <textarea
                                className="input-field"
                                placeholder="Love movies, cafes, road trips..."
                                maxLength={200}
                                rows={3}
                                value={form.bio}
                                onChange={(e) => update('bio', e.target.value)}
                            />
                            <div className="char-count">{form.bio.length}/200</div>
                        </div>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>City *</label>
                            <input className="input-field" placeholder="e.g. Kanpur" value={form.city} onChange={(e) => update('city', e.target.value)} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 16 }}>
                            <label>Area / Locality</label>
                            <input className="input-field" placeholder="e.g. Swaroop Nagar" value={form.area} onChange={(e) => update('area', e.target.value)} />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Your interests</h2>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Pick at least one</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {INTEREST_OPTIONS.map((interest) => (
                                <button
                                    key={interest}
                                    className={`chip ${form.interests.includes(interest) ? 'active' : ''}`}
                                    onClick={() => toggleInterest(interest)}
                                    type="button"
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Profile photo</h2>
                        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Choose an avatar for your profile</p>
                        <AvatarPicker value={form.profileImage} onChange={(value) => update('profileImage', value)} />
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                    {step > 0 && (
                        <button className="btn btn-secondary" onClick={() => setStep(step - 1)} style={{ flex: 1 }}>
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    {step < 3 ? (
                        <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canNext() || (step === 0 && form.dateOfBirth > maxBirthDate)} style={{ flex: 1 }}>
                            Next <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={loading} style={{ flex: 1 }}>
                            {loading ? 'Setting up...' : 'Complete Setup'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
