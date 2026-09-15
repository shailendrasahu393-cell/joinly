import axios from 'axios'
import { auth } from './firebase'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
})

api.interceptors.request.use(async (config) => {
    try {
        const user = auth?.currentUser
        if (user) {
            const token = await user.getIdToken()
            config.headers.Authorization = `Bearer ${token}`
        }
    } catch (err) {
        console.error('Failed to attach auth token:', err)
    }
    return config
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api

export const sendSignupOtp = async (email) => {
    const response = await api.post('/auth/send-signup-otp', { email })
    return response.data
}

export const verifySignupOtp = async (email, password, otp) => {
    const response = await api.post('/auth/verify-signup-otp', { email, password, otp })
    return response.data
}
