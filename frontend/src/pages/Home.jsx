import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import PlanCard from '../components/PlanCard'
import CategoryCard from '../components/CategoryCard'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import { CATEGORIES, getGreeting } from '../utils/constants'
import { Heart, Plus, TrendingUp } from 'lucide-react'

export default function Home() {
    const { userProfile } = useAuth()
    const navigate = useNavigate()
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPlans()
    }, [userProfile])

    const loadPlans = async () => {
        try {
            const params = {}
            if (userProfile?.city) params.city = userProfile.city
            const res = await api.get('/plans', { params })
            setPlans(res.data || [])
        } catch {
            setPlans([])
        } finally {
            setLoading(false)
        }
    }

    const handleCategory = (catId) => {
        navigate(`/discover?category=${catId}`)
    }

    const todayPlans = plans.filter((p) => {
        const today = new Date().toISOString().split('T')[0]
        return p.date === today
    })

    return (
        <div className="page">
            <MobileHeader />

            <div className="page-content">
                {/* Greeting */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
                        {getGreeting()} 👋
                    </h2>
                    <p style={{ fontSize: 15, color: 'var(--color-text-secondary)' }}>
                        What are you up to?
                    </p>
                </div>

                {/* Quick Categories */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
                        {CATEGORIES.slice(0, 8).map((cat) => (
                            <CategoryCard key={cat.id} category={cat} onClick={handleCategory} />
                        ))}
                    </div>
                </div>

                {/* Create Plan Prompt */}
                <div
                    className="card"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                        color: '#fff', marginBottom: 28, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 12,
                    }}
                    onClick={() => navigate('/create')}
                >
                    <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Plus size={22} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Create a Plan</div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>People around you can join</div>
                    </div>
                </div>

                {/* Today */}
                {todayPlans.length > 0 && (
                    <section style={{ marginBottom: 28 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} /> Happening Today
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {todayPlans.slice(0, 3).map((plan) => (
                                <PlanCard key={plan.id} plan={plan} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Plans Near You */}
                <section>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>
                        {userProfile?.city ? `Plans in ${userProfile.city}` : 'Recent Plans'}
                    </h3>
                    {loading ? (
                        <LoadingSkeleton type="card" count={3} />
                    ) : plans.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {plans.slice(0, 10).map((plan) => (
                                <PlanCard key={plan.id} plan={plan} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No plans yet"
                            message="Be the first to create a plan in your city."
                            action={
                                <button className="btn btn-primary" onClick={() => navigate('/create')}>
                                    <Plus size={16} /> Create a Plan
                                </button>
                            }
                        />
                    )}
                </section>

                                <footer className="home-footer">
                                        <span>Built with</span>
                                        <Heart size={14} fill="currentColor" aria-hidden="true" />
                                        <span>by</span>
                                        <a href="https://www.linkedin.com/in/shailendrasahu-/" target="_blank" rel="noreferrer">
                                                <span>Shailendra Sahu</span>
                                        </a>
                                </footer>
            </div>

                        <style>{`
                .home-footer {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                    margin-top: 40px;
                    padding: 18px 0 8px;
                    color: var(--color-text-tertiary);
                    font-size: 12px;
                }

                .home-footer > svg { color: var(--color-primary); }

                .home-footer a {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--color-primary);
                    font-weight: 600;
                    text-decoration: none;
                }

                .home-footer a:hover { text-decoration: underline; }
            `}</style>
        </div>
    )
}
