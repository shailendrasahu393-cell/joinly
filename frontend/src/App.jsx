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
import VerifyEmail from './pages/VerifyEmail'
import CreatePassword from './pages/CreatePassword'
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
import About from './pages/About'
import Messages from './pages/Messages'
import BlockedUsers from './pages/BlockedUsers'

export default function App() {
    const { currentUser, userProfile } = useAuth()
    const isProfileComplete = userProfile?.username
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
                <Route path="/about" element={<About />} />

                {/* Auth intermediate screens */}
                <Route path="/verify-email" element={<ProtectedRoute allowUnverified allowWithoutPassword><VerifyEmail /></ProtectedRoute>} />
                <Route path="/create-password" element={<ProtectedRoute allowUnverified allowWithoutPassword><CreatePassword /></ProtectedRoute>} />

                {/* Protected Routes */}
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/home" element={<ProtectedRoute requireProfileSetup><Home /></ProtectedRoute>} />
                <Route path="/discover" element={<ProtectedRoute requireProfileSetup><Discover /></ProtectedRoute>} />
                <Route path="/create" element={<ProtectedRoute requireProfileSetup><CreatePlan /></ProtectedRoute>} />
                <Route path="/plans/:planId" element={<ProtectedRoute requireProfileSetup><PlanDetails /></ProtectedRoute>} />
                <Route path="/my-plans" element={<ProtectedRoute requireProfileSetup><MyPlans /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute requireProfileSetup><Notifications /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute requireProfileSetup><Messages /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute requireProfileSetup><Profile /></ProtectedRoute>} />
                <Route path="/profile/:username" element={<ProtectedRoute requireProfileSetup><Profile /></ProtectedRoute>} />
                <Route path="/profile/edit" element={<ProtectedRoute requireProfileSetup><EditProfile /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute requireProfileSetup><Settings /></ProtectedRoute>} />
                <Route path="/blocked-users" element={<ProtectedRoute requireProfileSetup><BlockedUsers /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Landing />} />
            </Routes>

            {currentUser && isProfileComplete && <MobileBottomNav />}
        </>
    )
}
