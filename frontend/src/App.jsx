import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import MobileBottomNav from './components/MobileBottomNav'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Discover from './pages/Discover'
import CreatePlan from './pages/CreatePlan'
import PlanDetails from './pages/PlanDetails'
import MyPlans from './pages/MyPlans'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Settings from './pages/Settings'
import Messages from './pages/Messages'

export default function App() {
    const { currentUser } = useAuth()
    const [showSplash, setShowSplash] = useState(() => sessionStorage.getItem('joinly-splash-seen') !== 'true')

    useEffect(() => {
        if (!showSplash) return undefined

        sessionStorage.setItem('joinly-splash-seen', 'true')
        const timer = window.setTimeout(() => setShowSplash(false), 800)
        return () => window.clearTimeout(timer)
    }, [showSplash])

    if (showSplash) {
        return (
            <div className="splash-screen" aria-label="JOINLY loading">
                <div className="splash-logo">JOINLY</div>
            </div>
        )
    }

    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
                <Route path="/create" element={<ProtectedRoute><CreatePlan /></ProtectedRoute>} />
                <Route path="/plans/:planId" element={<ProtectedRoute><PlanDetails /></ProtectedRoute>} />
                <Route path="/my-plans" element={<ProtectedRoute><MyPlans /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Landing />} />
            </Routes>

            {currentUser && <MobileBottomNav />}
        </>
    )
}
