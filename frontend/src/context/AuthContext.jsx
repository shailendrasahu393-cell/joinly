import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange } from '../services/auth'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            setCurrentUser(user)
            if (user) {
                try {
                    const res = await api.get('/users/me')
                    setUserProfile(res.data)
                } catch {
                    setUserProfile(null)
                }
            } else {
                setUserProfile(null)
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

    return (
        <AuthContext.Provider value={{ currentUser, userProfile, loading, refreshProfile, setUserProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
