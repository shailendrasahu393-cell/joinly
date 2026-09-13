import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth'
import { auth, firebaseConfigured } from './firebase'

const requireFirebase = () => {
    if (!firebaseConfigured || !auth) {
        throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables.')
    }
    return auth
}

export const signUp = (email, password) =>
    createUserWithEmailAndPassword(requireFirebase(), email, password)

export const logIn = (email, password) =>
    signInWithEmailAndPassword(requireFirebase(), email, password)

export const resetPassword = (email) =>
    sendPasswordResetEmail(requireFirebase(), email)

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const logInWithGoogle = async () => {
    const firebaseAuth = requireFirebase()
    try {
        return await signInWithPopup(firebaseAuth, googleProvider)
    } catch (err) {
        if (err.code === 'auth/popup-blocked') {
            await signInWithRedirect(firebaseAuth, googleProvider)
            return { redirecting: true }
        }
        throw err
    }
}

export const getGoogleAuthErrorMessage = (err) => {
    const host = window.location.hostname
    if (err.code === 'auth/popup-closed-by-user') return 'Google sign-in was cancelled.'
    if (err.code === 'auth/popup-blocked') return 'Popup was blocked. Redirecting to Google sign-in...'
    if (err.code === 'auth/unauthorized-domain') {
        if (host === '127.0.0.1') return 'Open http://localhost:5173 instead, or add 127.0.0.1 in Firebase Authorized domains.'
        return `Add ${host} in Firebase Authorized domains.`
    }
    if (err.code === 'auth/operation-not-allowed') return 'Enable Google provider in Firebase Authentication.'
    if (err.code === 'auth/configuration-not-found') return 'Firebase Authentication is not enabled for this project.'
    if (err.message) return `Google sign-in failed: ${err.message}`
    return 'Google sign-in failed. Please try again.'
}

export const logOut = () => signOut(requireFirebase())

export const onAuthChange = (callback) => {
    if (!firebaseConfigured || !auth) {
        callback(null)
        return () => {}
    }
    return onAuthStateChanged(auth, callback)
}

export const getIdToken = async () => {
    const user = auth?.currentUser
    if (!user) return null
    return user.getIdToken()
}
