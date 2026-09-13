import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import CategoryCard from '../components/CategoryCard'
import { CATEGORIES, MAX_PARTICIPANT_OPTIONS, getCategoryById } from '../utils/constants'
import { ArrowRight, ArrowLeft } from 'lucide-react'

const STEPS = ['Activity', 'Details', 'When', 'Where', 'People']

export default function CreatePlan() {
    const navigate = useNavigate()
    const { userProfile } = useAuth()
    const toast = useToast()

    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)

    // Get tomorrow's date for default
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const defaultDate = tomorrow.toISOString().split('T')[0]

    const [form, setForm] = useState({
        category: '',
        title: '',
        description: '',
        date: defaultDate,
        startTime: '19:00',
        locationName: '',
        area: userProfile?.area || '',
        city: userProfile?.city || 'Kanpur',
        maxParticipants: 5,
    })

    const update = (k, v) => setForm({ ...form, [k]: v })

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const res = await api.post('/plans', form)
            toast.success('Your plan is live! 🎉')
            navigate(`/plans/${res.data.id}`)
        } catch (err) {
            toast.error('Failed to create plan. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const canNext = () => {
        if (step === 0) return !!form.category
        if (step === 1) return form.title.trim().length >= 5
        if (step === 2) return form.date && form.startTime
        if (step === 3) return form.locationName.trim() && form.city.trim()
        return true
    }

    const selectedCategory = getCategoryById(form.category)

    return (
        <div className="page">
            <MobileHeader title="Create Plan" showBack />

            <div className="page-content" style={{ maxWidth: 500 }}>
                {/* Progress */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: '0 16px' }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: 4, borderRadius: 2,
                            background: i <= step ? 'var(--color-primary)' : 'var(--color-border)',
                            transition: 'background 0.3s',
                        }} />
                    ))}
                </div>

                <div className="card" style={{ border: 'none', boxShadow: 'none' }}>
                    {step === 0 && (
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>What do you want to do?</h2>
                            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Select an activity category</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {CATEGORIES.map((cat) => (
                                    <div
                                        key={cat.id}
                                        onClick={() => { update('category', cat.id); setStep(1); }}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                            padding: '16px 8px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                                            border: form.category === cat.id ? `2px solid var(--color-primary)` : '1.5px solid var(--color-border-light)',
                                            background: form.category === cat.id ? 'color-mix(in srgb, var(--color-primary) 5%, white)' : 'var(--color-surface)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                                        <span style={{ fontSize: 13, fontWeight: form.category === cat.id ? 700 : 500 }}>{cat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <span style={{ fontSize: 24 }}>{selectedCategory.emoji}</span>
                                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Plan details</h2>
                            </div>

                            <div className="input-group" style={{ marginBottom: 20 }}>
                                <label>Title *</label>
                                <input
                                    className="input-field"
                                    placeholder={form.category === 'movie' ? 'Watching Inception tonight?' : 'What\'s the plan?'}
                                    value={form.title}
                                    onChange={(e) => update('title', e.target.value)}
                                    maxLength={60}
                                    autoFocus
                                />
                                <div className="char-count">{form.title.length}/60</div>
                            </div>

                            <div className="input-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    className="input-field"
                                    placeholder="Any details people should know? (e.g. Let's split the bill, I have an extra ticket)"
                                    value={form.description}
                                    onChange={(e) => update('description', e.target.value)}
                                    maxLength={500}
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>When is this happening?</h2>

                            <div className="input-group" style={{ marginBottom: 20 }}>
                                <label>Date *</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={form.date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => update('date', e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label>Time *</label>
                                <input
                                    type="time"
                                    className="input-field"
                                    value={form.startTime}
                                    onChange={(e) => update('startTime', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Where are you going?</h2>
                            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Prefer public places for safety.</p>

                            <div className="input-group" style={{ marginBottom: 16 }}>
                                <label>Venue / Place *</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. PVR Cinemas, Z Square Mall"
                                    value={form.locationName}
                                    onChange={(e) => update('locationName', e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: 16 }}>
                                <label>Area / Locality</label>
                                <input
                                    className="input-field"
                                    placeholder="e.g. Mall Road"
                                    value={form.area}
                                    onChange={(e) => update('area', e.target.value)}
                                />
                            </div>

                            <div className="input-group">
                                <label>City *</label>
                                <input
                                    className="input-field"
                                    value={form.city}
                                    onChange={(e) => update('city', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>How many people?</h2>
                            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Select the maximum number of people you want to join.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                                {MAX_PARTICIPANT_OPTIONS.map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => update('maxParticipants', num)}
                                        className={`btn ${form.maxParticipants === num ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ fontSize: 18, border: form.maxParticipants !== num ? '1.5px solid var(--color-border)' : undefined, color: form.maxParticipants !== num ? 'var(--color-text)' : undefined }}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>

                            <div style={{ padding: 16, background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Plan Summary</div>
                                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                                    <strong>{form.title}</strong><br />
                                    at {form.locationName} ({form.city})<br />
                                    Looking for up to {form.maxParticipants} people
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                        {step > 0 && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setStep(step - 1)}
                                style={{ flex: 1 }}
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                        )}

                        {step < 4 ? (
                            <button
                                className="btn btn-primary"
                                onClick={() => setStep(step + 1)}
                                disabled={!canNext()}
                                style={{ flex: step === 0 ? 'none' : 1, width: step === 0 ? '100%' : undefined }}
                            >
                                Next <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleSubmit}
                                disabled={loading || !canNext()}
                                style={{ flex: 2 }}
                            >
                                {loading ? 'Publishing...' : 'Publish Plan'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
