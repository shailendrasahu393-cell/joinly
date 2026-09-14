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

    const handleRequestAction = async (requestId, action) => {
        try {
            await api.patch(`/join-requests/${requestId}`, { action })
            setData((current) => ({
                ...current,
                requests: current.requests.map((request) => (
                    request.id === requestId ? { ...request, status: action } : request
                ))
            }))
        } catch (err) {
            console.error(`Failed to ${action} join request`, err)
            window.alert(err.response?.data?.detail || `Unable to ${action} this request.`)
        }
    }

    useEffect(() => {
        const loadMyActivity = async () => {
            setLoading(true)
            try {
                const [joinedRes, createdRes, reqsRes] = await Promise.all([
                    api.get('/join-requests/my-plans?type=joined'),
                    api.get('/join-requests/my-plans?type=created'),
                    api.get('/join-requests/incoming')
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
                            {data.requests.map((req) => (
                                <div key={req.id}>
                                    <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                        {req.plan?.title || 'Your plan'}
                                    </div>
                                    <JoinRequestCard
                                        request={req}
                                        onAccept={(id) => handleRequestAction(id, 'accept')}
                                        onDecline={(id) => handleRequestAction(id, 'decline')}
                                    />
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
