import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowUnverified, allowWithoutPassword, requireProfileSetup }) {
    const { currentUser, userProfile, loading, needsEmailVerification, needsPasswordSetup } = useAuth()

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
            </div>
        )
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />
    }

    if (needsEmailVerification && !allowUnverified) {
        return <Navigate to="/verify-email" replace />
    }

    if (needsPasswordSetup && !allowWithoutPassword) {
        return <Navigate to="/create-password" replace />
    }

    if (requireProfileSetup && userProfile && !userProfile.username) {
        return <Navigate to="/onboarding" replace />
    }

    return children
}
