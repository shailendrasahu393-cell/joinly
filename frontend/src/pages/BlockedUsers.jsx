import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import MobileHeader from '../components/MobileHeader'
import UserAvatar from '../components/UserAvatar'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import { Ban } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function BlockedUsers() {
    const navigate = useNavigate()
    const toast = useToast()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    const load = async () => {
        try { setUsers((await api.get('/users/blocked')).data || []) } catch { toast.error('Unable to load blocked users.') } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const unblock = async (id) => {
        try { await api.delete(`/users/blocked/${id}`); setUsers((current) => current.filter((user) => user.id !== id)); toast.success('User unblocked.') } catch { toast.error('Unable to unblock user.') }
    }

    return <div className="page"><MobileHeader title="Blocked Users" showBack /><div className="page-content">
        {loading ? <LoadingSkeleton type="list" count={3} /> : users.length ? users.map((user) => <div className="card" key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}><UserAvatar src={user.profileImage} name={user.fullName} size={44} /><div style={{ flex: 1 }}><strong>{user.fullName}</strong><div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>@{user.username}</div></div><button className="btn btn-secondary btn-sm" onClick={() => unblock(user.id)}>Unblock</button></div>) : <EmptyState icon={Ban} title="No blocked users" message="People you block will appear here." />}
    </div></div>
}