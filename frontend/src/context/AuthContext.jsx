import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange, hasPasswordProvider, hasGoogleProvider } from '../services/auth'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [needsEmailVerification, setNeedsEmailVerification] = useState(false)
    const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            setCurrentUser(user)
            if (user) {
                // Check if email/password user needs verification
                const isEmailPasswordUser = hasPasswordProvider(user) && !hasGoogleProvider(user)
                const emailNotVerified = isEmailPasswordUser && !user.emailVerified
                setNeedsEmailVerification(emailNotVerified)

                // Check if Google user needs password linking
                const isGoogleUser = hasGoogleProvider(user)
                const passwordNotLinked = isGoogleUser && !hasPasswordProvider(user)
                setNeedsPasswordSetup(passwordNotLinked)

                // Only fetch profile if user is in a usable state
                if (!emailNotVerified) {
                    try {
                        const res = await api.get('/users/me')
                        setUserProfile(res.data)
                    } catch {
                        setUserProfile(null)
                    }
                } else {
                    setUserProfile(null)
                }
            } else {
                setUserProfile(null)
                setNeedsEmailVerification(false)
                setNeedsPasswordSetup(false)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const refreshProfile = async () => {
        try {
            const res = await api.get('/users/me')
            setUserProfile(res.data)
        } catch {
            setUserProfile(null)
        }
    }

    const refreshAuthState = (user) => {
        if (!user) return
        const isEmailPasswordUser = hasPasswordProvider(user) && !hasGoogleProvider(user)
        setNeedsEmailVerification(isEmailPasswordUser && !user.emailVerified)
        setNeedsPasswordSetup(hasGoogleProvider(user) && !hasPasswordProvider(user))
    }

    return (
        <AuthContext.Provider value={{
            currentUser, userProfile, loading,
            needsEmailVerification, needsPasswordSetup,
            refreshProfile, setUserProfile, refreshAuthState
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
