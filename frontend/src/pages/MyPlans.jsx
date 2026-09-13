import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import PlanCard from '../components/PlanCard'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import JoinRequestCard from '../components/JoinRequestCard'
import { CalendarDays, Inbox, CheckCircle } from 'lucide-react'

export default function MyPlans() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('joined')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        joined: [],
        created: [],
        requests: []
    })

    const handleDeletePlan = async (plan) => {
        if (!window.confirm(`Delete "${plan.title}"? This cannot be undone.`)) return

        try {
            await api.delete(`/plans/${plan.id}`)
            setData((current) => ({
                ...current,
                created: current.created.filter((item) => item.id !== plan.id)
            }))
        } catch (err) {
            console.error('Failed to delete plan', err)
            window.alert('Unable to delete this plan. Please try again.')
        }
    }

    useEffect(() => {
        const loadMyActivity = async () => {
            setLoading(true)
            try {
                const [joinedRes, createdRes, reqsRes] = await Promise.all([
                    api.get('/join-requests/my-plans?type=joined'),
                    api.get('/join-requests/my-plans?type=created'),
                    api.get('/join-requests/me')
                ])

                setData({
                    joined: joinedRes.data || [],
                    created: createdRes.data || [],
                    requests: reqsRes.data || []
                })
            } catch (err) {
                console.error('Failed to load activity', err)
            } finally {
                setLoading(false)
            }
        }

        loadMyActivity()
    }, [])

    return (
        <div className="page">
            <MobileHeader title="My Plans" />

            {/* Tabs */}
            <div className="tabs" style={{ background: 'var(--color-surface)', position: 'sticky', top: 56, zIndex: 40 }}>
                <button
                    className={`tab ${activeTab === 'joined' ? 'active' : ''}`}
                    onClick={() => setActiveTab('joined')}
                >
                    Joined
                </button>
                <button
                    className={`tab ${activeTab === 'created' ? 'active' : ''}`}
                    onClick={() => setActiveTab('created')}
                >
                    Created
                </button>
                <button
                    className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    Requests {data.requests.filter(r => r.status === 'pending').length > 0 &&
                        <span className="badge" style={{ marginLeft: 6 }}>{data.requests.filter(r => r.status === 'pending').length}</span>
                    }
                </button>
            </div>

            <div className="page-content">
                {loading ? (
                    <LoadingSkeleton type="card" count={3} />
                ) : activeTab === 'joined' ? (
                    data.joined.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {data.joined.map((plan) => (
                                <PlanCard key={plan.id} plan={plan} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={CheckCircle}
                            title="No joined plans"
                            message="You haven't been accepted to any plans yet. Start requesting!"
                            action={<button className="btn btn-primary" onClick={() => navigate('/discover')}>Discover Plans</button>}
                        />
                    )
                ) : activeTab === 'created' ? (
                    data.created.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {data.created.map((plan) => (
                                <PlanCard key={plan.id} plan={plan} onDelete={handleDeletePlan} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={CalendarDays}
                            title="No created plans"
                            message="You haven't created any plans yet. Be a host!"
                            action={<button className="btn btn-primary" onClick={() => navigate('/create')}>Create a Plan</button>}
                        />
                    )
                ) : activeTab === 'requests' ? (
                    data.requests.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {/* Note: This assumes API returns enriched requests with plan info */}
                            {data.requests.map((req) => (
                                <div key={req.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                    <div style={{ background: 'var(--color-bg-secondary)', padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)' }}>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                                            Requested to join
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: 16 }}>{req.plan?.title || 'A plan'}</div>
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                                                Status: <span style={{
                                                    fontWeight: 600,
                                                    color: req.status === 'accepted' ? 'var(--color-success)' : req.status === 'declined' ? 'var(--color-danger)' : 'var(--color-warning)'
                                                }}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
                                            </div>
                                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/plans/${req.planId}`)}>
                                                View Plan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Inbox}
                            title="No requests sent"
                            message="You haven't sent any join requests yet."
                        />
                    )
                ) : null}
            </div>
        </div>
    )
}
