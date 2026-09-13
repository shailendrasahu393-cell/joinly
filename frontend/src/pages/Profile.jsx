import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import UserAvatar from '../components/UserAvatar'
import LoadingSkeleton from '../components/LoadingSkeleton'
import PlanCard from '../components/PlanCard'
import EmptyState from '../components/EmptyState'
import { Settings, Share2, MapPin, AlertTriangle, MessageCircle, Grid3X3 } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function Profile() {
    const { username } = useParams()
    const { currentUser, userProfile } = useAuth()
    const navigate = useNavigate()
    const toast = useToast()

    const [profile, setProfile] = useState(null)
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)

    const isOwnProfile = !username || userProfile?.username === username

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true)
            try {
                if (isOwnProfile) {
                    setProfile(userProfile)
                    if (userProfile) {
                        const plansRes = await api.get('/plans', { params: { host_id: currentUser.uid } })
                        setPlans(plansRes.data || [])
                    }
                } else {
                    const profileRes = await api.get(`/users/${username}`)
                    setProfile(profileRes.data)
                    const plansRes = await api.get('/plans', { params: { host_id: profileRes.data.id } })
                    setPlans(plansRes.data || [])
                }
            } catch (err) {
                console.error('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }

        if (userProfile !== undefined) {
            loadProfile()
        }
    }, [username, isOwnProfile, userProfile, currentUser])

    const handleShare = async () => {
        const url = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profile.fullName} on JOINLY`,
                    url
                })
            } catch (err) { }
        } else {
            navigator.clipboard.writeText(url)
            toast.success('Link copied to clipboard')
        }
    }

    if (loading) {
        return (
            <div className="page">
                <MobileHeader showBack />
                <div className="page-content">
                    <LoadingSkeleton type="profile" />
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="page">
                <MobileHeader showBack />
                <div className="page-content">
                    <EmptyState title="User not found" message="This profile doesn't exist." />
                </div>
            </div>
        )
    }

    return (
        <div className="page">
            <MobileHeader
                showBack={!isOwnProfile}
                title={profile.username}
                showCity={false}
            />

            <div className="page-content profile-page-content">
                <div style={{ position: 'relative' }}>
                    {isOwnProfile ? (
                        <button
                            onClick={() => navigate('/settings')}
                            className="mh-icon-btn"
                            style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
                        >
                            <Settings size={18} />
                        </button>
                    ) : (
                        <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, display: 'flex', gap: 8 }}>
                            <button onClick={handleShare} className="mh-icon-btn" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                                <Share2 size={18} />
                            </button>
                            <button
                                onClick={() => toast.info('Reporting coming soon.')}
                                className="mh-icon-btn"
                                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}
                            >
                                <AlertTriangle size={18} />
                            </button>
                        </div>
                    )}

                    <div className="profile-hero">
                        <div className="profile-identity">
                            <UserAvatar
                                src={profile.profileImage}
                                name={profile.fullName || profile.email || 'JOINLY'}
                                size={100}
                                className="profile-avatar-large"
                            />
                            <div className="profile-identity-copy">
                                <h1 className="profile-name">
                                    {profile.fullName || 'Complete your profile'}
                                </h1>
                                <div className="profile-handle">{profile.username ? `@${profile.username}` : 'Add a username'}</div>
                                {(profile.area || profile.city) && (
                                    <div className="profile-location">
                                        <MapPin size={14} /> {[profile.area, profile.city].filter(Boolean).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="profile-stats">
                            <div><strong>{plans.length}</strong><span>plans</span></div>
                            <div><strong>{profile.interests?.length || 0}</strong><span>interests</span></div>
                            <div><strong>{profile.city ? 1 : 0}</strong><span>city</span></div>
                        </div>

                        <div className="profile-actions">
                            {!isOwnProfile && <button className="btn btn-primary btn-sm" onClick={() => navigate(`/messages?user=${profile.id}`)}><MessageCircle size={16} /> Message</button>}
                        </div>
                    </div>
                </div>

                {profile.bio && (
                    <section className="profile-bio-card">
                        <p>{profile.bio}</p>
                    </section>
                )}

                {profile.interests && profile.interests.length > 0 && (
                    <section className="profile-section">
                        <h3>Interests</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {profile.interests.map(i => (
                                <span key={i} className="chip active">{i}</span>
                            ))}
                        </div>
                    </section>
                )}

                <section className="profile-section">
                    <div className="profile-section-heading"><Grid3X3 size={17} /><h3>
                        {isOwnProfile ? 'Your Hosted Plans' : `Plans hosted by ${profile.firstName || profile.fullName?.split(' ')[0] || 'this user'}`}
                    </h3></div>

                    {plans.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {plans.map(plan => (
                                <PlanCard key={plan.id} plan={plan} showHost={false} />
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                                No active plans hosted right now.
                            </div>
                        </div>
                    )}
                </section>
            </div>

                        <style>{`
                .profile-page-content { max-width: 720px; }
                .profile-hero { padding: 26px 0 30px; }
                .profile-identity { display: flex; align-items: center; gap: 22px; }
                .profile-identity-copy { min-width: 0; }
        .profile-avatar-large {
          border: 4px solid var(--color-surface);
                    box-shadow: 0 0 0 2px var(--color-primary-light), 0 8px 20px rgba(0,0,0,0.1);
        }
                .profile-name { margin: 0 0 2px; font-size: 24px; font-weight: 800; }
                .profile-handle { color: var(--color-text-secondary); font-size: 14px; }
                .profile-stats { display: flex; gap: 34px; margin: 22px 0 14px; padding-left: 122px; }
                .profile-stats div { display: flex; flex-direction: column; gap: 2px; }
                .profile-stats strong { font-size: 18px; color: var(--color-text); }
                .profile-stats span { color: var(--color-text-secondary); font-size: 12px; }
                .profile-location { display: inline-flex; align-items: center; gap: 5px; color: var(--color-primary); font-size: 13px; font-weight: 600; margin-top: 10px; }
                .profile-actions { display: flex; gap: 8px; margin-top: 4px; padding-left: 122px; }
                .profile-bio-card { margin: 0 0 8px; padding: 16px; border: 1px solid var(--color-border-light); border-radius: var(--radius-md); background: var(--color-surface); }
                .profile-bio-card p { margin: 0; line-height: 1.5; font-size: 14px; }
                .profile-section { border-top: 1px solid var(--color-border-light); padding: 20px 0 28px; }
                .profile-section h3 { margin: 0 0 12px; font-size: 16px; }
                .profile-section-heading { display: flex; align-items: center; gap: 7px; margin-bottom: 12px; }
                .profile-section-heading h3 { margin: 0; }
                @media (max-width: 520px) {
                    .profile-identity { gap: 14px; }
                    .profile-avatar-large { width: 84px !important; height: 84px !important; }
                    .profile-name { font-size: 20px; }
                    .profile-stats { padding-left: 98px; gap: 20px; }
                    .profile-actions { padding-left: 98px; }
                }
      `}</style>
        </div>
    )
}
