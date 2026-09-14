import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import AvatarPicker from '../components/AvatarPicker'
import { INTEREST_OPTIONS, GENDER_OPTIONS } from '../utils/constants'

export default function EditProfile() {
    const navigate = useNavigate()
    const toast = useToast()
    const { userProfile, refreshProfile } = useAuth()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({ fullName: '', username: '', dateOfBirth: '', gender: '', bio: '', city: '', area: '', interests: [], profileImage: '' })
    const maxBirthDate = (() => {
        const date = new Date()
        date.setFullYear(date.getFullYear() - 17)
        return date.toISOString().split('T')[0]
    })()

    useEffect(() => {
        if (userProfile) setForm((current) => ({ ...current, ...userProfile, interests: userProfile.interests || [] }))
    }, [userProfile])

    const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))
    const toggleInterest = (interest) => update('interests', form.interests.includes(interest)
        ? form.interests.filter((item) => item !== interest)
        : [...form.interests, interest])

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!form.fullName || !form.username || !form.dateOfBirth) return toast.error('Name, username and date of birth are required.')
        if (form.dateOfBirth > maxBirthDate) return toast.error('You must be at least 17 years old.')
        setLoading(true)
        try {
            await api.patch('/users/me', form)
            await refreshProfile()
            toast.success('Profile updated successfully.')
            navigate('/profile')
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Unable to update profile.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page">
            <MobileHeader showBack title="Edit Profile" />
            <div className="page-content">
                <form className="edit-profile-form" onSubmit={handleSubmit}>
                    <h2>Edit Profile</h2>
                    <p className="form-subtitle">Keep your profile information up to date.</p>
                    <div className="input-group"><label>Profile avatar</label><AvatarPicker value={form.profileImage} onChange={(value) => update('profileImage', value)} /></div>
                    <div className="input-group"><label>Full Name *</label><input className="input-field" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} /></div>
                    <div className="input-group"><label>Username *</label><input className="input-field" value={form.username} onChange={(e) => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} /></div>
                    <div className="input-group"><label>Date of Birth *</label><input type="date" max={maxBirthDate} className="input-field" value={form.dateOfBirth || ''} onChange={(e) => update('dateOfBirth', e.target.value)} /></div>
                    <div className="input-group"><label>Gender</label><select className="input-field" value={form.gender || ''} onChange={(e) => update('gender', e.target.value)}><option value="">Select gender</option>{GENDER_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div>
                    <div className="input-group"><label>Bio</label><textarea className="input-field" rows={4} maxLength={200} value={form.bio || ''} onChange={(e) => update('bio', e.target.value)} /><small>{(form.bio || '').length}/200</small></div>
                    <div className="input-group"><label>City *</label><input className="input-field" value={form.city || ''} onChange={(e) => update('city', e.target.value)} /></div>
                    <div className="input-group"><label>Area / Locality</label><input className="input-field" value={form.area || ''} onChange={(e) => update('area', e.target.value)} /></div>
                    <div className="input-group"><label>Interests</label><div className="interest-list">{INTEREST_OPTIONS.map((interest) => <button key={interest} type="button" className={`chip ${form.interests.includes(interest) ? 'active' : ''}`} onClick={() => toggleInterest(interest)}>{interest}</button>)}</div></div>
                    <button className="btn btn-primary btn-block btn-lg" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                </form>
            </div>
            <style>{`.edit-profile-form { max-width: 560px; margin: 0 auto; display: grid; gap: 18px; } .edit-profile-form h2 { margin: 0; font-size: 24px; } .form-subtitle { margin: -10px 0 4px; color: var(--color-text-secondary); } .edit-profile-form .input-group { display: grid; gap: 7px; } .edit-profile-form small { color: var(--color-text-tertiary); text-align: right; } .interest-list { display: flex; flex-wrap: wrap; gap: 8px; }`}</style>
        </div>
    )
}
