import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import PlanCard from '../components/PlanCard'
import LoadingSkeleton from '../components/LoadingSkeleton'
import EmptyState from '../components/EmptyState'
import { CATEGORIES } from '../utils/constants'
import { Search, SlidersHorizontal, X, MessageCircle } from 'lucide-react'
import UserAvatar from '../components/UserAvatar'

export default function Discover() {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [category, setCategory] = useState(searchParams.get('category') || '')
    const [city, setCity] = useState(searchParams.get('city') || '')
    const [showFilters, setShowFilters] = useState(false)
    const [resultType, setResultType] = useState('plans')
    const [people, setPeople] = useState([])
    const [peopleLoading, setPeopleLoading] = useState(false)

    const loadPlans = useCallback(async () => {
        setLoading(true)
        try {
            const params = {}
            if (search) params.q = search
            if (category) params.category = category
            if (city) params.city = city
            const res = await api.get('/plans', { params })
            setPlans(res.data || [])
        } catch {
            setPlans([])
        } finally {
            setLoading(false)
        }
    }, [search, category, city])

    useEffect(() => {
        if (resultType !== 'plans') return undefined
        const timer = setTimeout(loadPlans, 300)
        return () => clearTimeout(timer)
    }, [loadPlans, resultType])

    useEffect(() => {
        if (resultType !== 'people') return undefined
        const timer = setTimeout(async () => {
            if (!search.trim()) {
                setPeople([])
                return
            }
            setPeopleLoading(true)
            try {
                const res = await api.get('/users/search', { params: { username: search } })
                setPeople(res.data || [])
            } catch {
                setPeople([])
            } finally {
                setPeopleLoading(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [search, resultType])

    const clearFilters = () => {
        setSearch('')
        setCategory('')
        setCity('')
        setSearchParams({})
    }

    const hasFilters = search || category || city

    return (
        <div className="page">
            <MobileHeader title="Discover" />

            <div className="page-content">
                {/* Search Bar */}
                <div className="search-mode-tabs" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button className={`tab ${resultType === 'plans' ? 'active' : ''}`} onClick={() => setResultType('plans')}>Plans</button>
                    <button className={`tab ${resultType === 'people' ? 'active' : ''}`} onClick={() => setResultType('people')}>People</button>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{
                            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                            color: 'var(--color-text-tertiary)',
                        }} />
                        <input
                            className="input-field"
                            style={{ width: '100%', paddingLeft: 40 }}
                            placeholder={resultType === 'people' ? 'Search by username...' : 'Search plans, venues, areas...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {resultType === 'plans' && <button
                        className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ padding: '0 14px' }}
                    >
                        <SlidersHorizontal size={18} />
                    </button>}
                </div>

                {/* Filters */}
                {resultType === 'plans' && showFilters && (
                    <div className="card" style={{ marginBottom: 16, padding: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8 }}>
                                Category
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        className={`chip ${category === cat.id ? 'active' : ''}`}
                                        onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                                        style={{ fontSize: 12 }}
                                    >
                                        {cat.emoji} {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-group">
                            <label>City</label>
                            <input
                                className="input-field"
                                placeholder="e.g. Kanpur"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Active Filters */}
                {resultType === 'plans' && hasFilters && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        {category && (
                            <span className="chip active" style={{ fontSize: 12 }}>
                                {CATEGORIES.find((c) => c.id === category)?.emoji} {CATEGORIES.find((c) => c.id === category)?.label}
                                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setCategory('')} />
                            </span>
                        )}
                        {city && (
                            <span className="chip active" style={{ fontSize: 12 }}>
                                📍 {city}
                                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setCity('')} />
                            </span>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ fontSize: 12 }}>
                            Clear all
                        </button>
                    </div>
                )}

                {/* Results */}
                {resultType === 'people' ? (
                    peopleLoading ? <LoadingSkeleton type="list" count={3} /> : people.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {people.map((person) => (
                                <div key={person.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14 }}>
                                    <UserAvatar src={person.profileImage} name={person.fullName} size={46} />
                                    <button
                                        className="person-result"
                                        onClick={() => navigate(`/profile/${person.username}`)}
                                        style={{ flex: 1, minWidth: 0, border: 0, background: 'none', textAlign: 'left', cursor: 'pointer' }}
                                    >
                                        <strong>{person.fullName}</strong>
                                        <span style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: 13 }}>@{person.username}</span>
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/messages?user=${person.id}`)} aria-label={`Message ${person.fullName}`}>
                                        <MessageCircle size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="No people found" message={search ? 'Try another username.' : 'Search for a username to find people.'} />
                    )
                ) : loading ? (
                    <LoadingSkeleton type="card" count={4} />
                ) : plans.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                            {plans.length} plan{plans.length !== 1 ? 's' : ''} found
                        </p>
                        {plans.map((plan) => (
                            <PlanCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No plans found"
                        message={hasFilters ? 'Try adjusting your filters.' : 'No plans available yet. Create one!'}
                        action={
                            <button className="btn btn-primary" onClick={() => navigate('/create')}>
                                Create a Plan
                            </button>
                        }
                    />
                )}
            </div>
        </div>
    )
}
