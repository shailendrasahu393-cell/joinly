import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import UserAvatar from '../components/UserAvatar'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import JoinRequestCard from '../components/JoinRequestCard'
import Modal from '../components/Modal'
import { getCategoryById, formatDate, formatTime, calculateAge } from '../utils/constants'
import { MapPin, Clock, Users, Calendar, AlertTriangle, Share2, MoreVertical, ArrowRight } from 'lucide-react'

export default function PlanDetails() {
    const { planId } = useParams()
    const navigate = useNavigate()
    const { currentUser, userProfile } = useAuth()
    const toast = useToast()

    const [plan, setPlan] = useState(null)
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [requestLoading, setRequestLoading] = useState(false)

    // Modals
    const [showHostMenu, setShowHostMenu] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const planRes = await api.get(`/plans/${planId}`)
            setPlan(planRes.data)

            // If user is host, load requests
            if (planRes.data.hostId === currentUser?.uid) {
                const reqRes = await api.get(`/plans/${planId}/requests`)
                setRequests(reqRes.data)
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setPlan(null)
            } else {
                toast.error('Failed to load plan details.')
            }
        } finally {
            setLoading(false)
        }
    }, [planId, currentUser?.uid, toast])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleRequestJoin = async () => {
        setRequestLoading(true)
        try {
            await api.post(`/plans/${planId}/join`)
            toast.success('Join request sent!')
            loadData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to send request.')
        } finally {
            setRequestLoading(false)
        }
    }

    const handleAcceptRequest = async (reqId) => {
        try {
            await api.patch(`/join-requests/${reqId}`, { action: 'accept' })
            toast.success('Request accepted!')
            loadData()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Action failed.')
        }
    }

    const handleDeclineRequest = async (reqId) => {
        try {
            await api.patch(`/join-requests/${reqId}`, { action: 'decline' })
            toast.info('Request declined.')
            loadData()
        } catch (err) {
            toast.error('Action failed.')
        }
    }

    const handleCancelPlan = async () => {
        if (!window.confirm('Are you sure you want to cancel this plan?')) return
        try {
            await api.patch(`/plans/${planId}`, { status: 'cancelled' })
            toast.success('Plan cancelled.')
            setShowHostMenu(false)
            loadData()
        } catch (err) {
            toast.error('Failed to cancel plan.')
        }
    }

    const handleShare = async () => {
        const url = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join me on JOINLY: ${plan.title}`,
                    url
                })
            } catch (err) {
                console.log('Error sharing', err)
            }
        } else {
            navigator.clipboard.writeText(url)
            toast.success('Link copied to clipboard')
        }
    }

    if (loading) {
        return (
            <div className="page">
                <MobileHeader showBack title="Plan" />
                <div className="page-content">
                    <LoadingSkeleton type="profile" />
                </div>
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="page">
                <MobileHeader showBack title="Not Found" />
                <div className="page-content">
                    <EmptyState title="Plan not found" message="This plan may have been deleted or is unavailable." />
                </div>
            </div>
        )
    }

    const cat = getCategoryById(plan.category)
    const isHost = currentUser?.uid === plan.hostId
    const spotsLeft = (plan.maxParticipants || 5) - (plan.participantCount || 0)
    const isFull = spotsLeft <= 0
    const isCancelled = plan.status === 'cancelled'
    const isClosed = plan.status === 'closed'

    // Check if current user has requested or joined
    const myRequest = plan.userRequestStatus
    const hasRequested = myRequest === 'pending'
    const isJoined = myRequest === 'accepted'

    return (
        <div className="page">
            <MobileHeader showBack title="Plan Details" />

            <div className="page-content">
                {/* Banner */}
                <div style={{
                    background: `color-mix(in srgb, ${cat.color} 10%, var(--color-surface))`,
                    padding: '24px 20px',
                    borderRadius: 'var(--radius-xl)',
                    marginBottom: 20,
                    border: `1px solid color-mix(in srgb, ${cat.color} 20%, transparent)`
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className={`category-badge cat-${plan.category}`} style={{ marginBottom: 12 }}>
                            {cat.emoji} {cat.label}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={handleShare} className="mh-icon-btn" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                                <Share2 size={18} />
                            </button>
                            {isHost ? (
                                <button onClick={() => setShowHostMenu(true)} className="mh-icon-btn" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                                    <MoreVertical size={18} />
                                </button>
                            ) : (
                                <button onClick={() => setShowReportModal(true)} className="mh-icon-btn" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-light)' }}>
                                    <AlertTriangle size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>{plan.title}</h1>
                    <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--color-text-secondary)', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={16} /> {formatDate(plan.date)}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> {formatTime(plan.startTime)}</div>
                    </div>
                </div>

                {/* Status Banners */}
                {isCancelled && (
                    <div style={{ padding: 12, background: 'var(--color-danger)', color: '#fff', borderRadius: 'var(--radius-md)', marginBottom: 20, fontWeight: 600, textAlign: 'center' }}>
                        This plan has been cancelled by the host.
                    </div>
                )}
                {isClosed && !isCancelled && (
                    <div style={{ padding: 12, background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontWeight: 600, textAlign: 'center' }}>
                        Joining is closed for this plan.
                    </div>
                )}

                {/* Location & Details Card */}
                <div className="card" style={{ padding: '20px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 16 }}>{plan.locationName}</div>
                                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                    {[plan.area, plan.city].filter(Boolean).join(', ')}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Users size={18} style={{ color: 'var(--color-primary)' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 16 }}>
                                    {plan.participantCount} / {plan.maxParticipants} participants
                                </div>
                                {!isJoined && !isHost && spotsLeft > 0 && (
                                    <div style={{ fontSize: 14, color: 'var(--color-success)', marginTop: 2, fontWeight: 500 }}>
                                        {spotsLeft} spots left
                                    </div>
                                )}
                                {!isJoined && !isHost && isFull && (
                                    <div style={{ fontSize: 14, color: 'var(--color-danger)', marginTop: 2, fontWeight: 500 }}>
                                        Plan is full
                                    </div>
                                )}
                            </div>
                        </div>

                        {plan.description && (
                            <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--color-border-light)' }}>
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>Details</div>
                                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    {plan.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Host Profile (if not host) */}
                {!isHost && plan.host && (
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Hosted by</h3>
                        <div
                            className="card"
                            style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => navigate(`/profile/${plan.host.username}`)}
                        >
                            <UserAvatar src={plan.host.profileImage} name={plan.host.fullName} size={56} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 16 }}>{plan.host.fullName}</div>
                                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                    @{plan.host.username} • {plan.host.age || calculateAge(plan.host.dateOfBirth)}
                                </div>
                            </div>
                            <ArrowRight size={18} style={{ color: 'var(--color-border)' }} />
                        </div>
                    </div>
                )}

                {/* Host View - Requests */}
                {isHost && (
                    <div style={{ marginBottom: 32 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Manage Requests</h3>

                        {requests.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
                                <Users size={32} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px' }} />
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>No requests yet</div>
                                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                                    When people ask to join, they'll appear here.
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {requests.map(req => (
                                    <JoinRequestCard
                                        key={req.id}
                                        request={req}
                                        onAccept={handleAcceptRequest}
                                        onDecline={handleDeclineRequest}
                                        showActions={!isFull || req.status !== 'pending'} // Hide actions if full, unless already accepted/declined
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Fixed Bottom Action Bar (if not host) */}
                {!isHost && !isCancelled && !isClosed && (
                    <div style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                        background: 'var(--color-surface)', borderTop: '1px solid var(--color-border-light)',
                        display: 'flex', justifyContent: 'center', zIndex: 40,
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ width: '100%', maxWidth: 600 }}>
                            {isJoined ? (
                                <button className="btn btn-success btn-block btn-lg" style={{ background: 'var(--color-success)', color: '#fff', cursor: 'default' }}>
                                    ✓ You're Joining
                                </button>
                            ) : hasRequested ? (
                                <button className="btn btn-secondary btn-block btn-lg" disabled>
                                    Request Sent
                                </button>
                            ) : isFull ? (
                                <button className="btn btn-secondary btn-block btn-lg" disabled>
                                    Plan is Full
                                </button>
                            ) : (
                                <button
                                    className="btn btn-primary btn-block btn-lg"
                                    onClick={handleRequestJoin}
                                    disabled={requestLoading || !currentUser}
                                >
                                    {requestLoading ? 'Sending...' : 'Request to Join'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={showHostMenu} onClose={() => setShowHostMenu(false)} title="Manage Plan">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }} onClick={() => { }}>
                        Edit Plan (Coming Soon)
                    </button>
                    <button className="btn btn-danger btn-block" style={{ justifyContent: 'flex-start' }} onClick={handleCancelPlan}>
                        Cancel Plan
                    </button>
                </div>
            </Modal>

            <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Plan">
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                    Reporting is coming soon. Please rely on standard safety practices.
                </p>
                <button className="btn btn-secondary btn-block" onClick={() => setShowReportModal(false)}>Close</button>
            </Modal>
        </div>
    )
}
