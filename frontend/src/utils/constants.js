export const CATEGORIES = [
    { id: 'movie', label: 'Movie', emoji: '🎬', color: 'var(--color-category-movie)' },
    { id: 'food', label: 'Food', emoji: '🍕', color: 'var(--color-category-food)' },
    { id: 'cafe', label: 'Café', emoji: '☕', color: 'var(--color-category-cafe)' },
    { id: 'travel', label: 'Travel', emoji: '✈️', color: 'var(--color-category-travel)' },
    { id: 'explore', label: 'Explore', emoji: '🧭', color: 'var(--color-category-explore)' },
    { id: 'event', label: 'Event', emoji: '🎉', color: 'var(--color-category-event)' },
    { id: 'sports', label: 'Sports', emoji: '⚽', color: 'var(--color-category-sports)' },
    { id: 'study', label: 'Study', emoji: '📚', color: 'var(--color-category-study)' },
    { id: 'gaming', label: 'Gaming', emoji: '🎮', color: 'var(--color-category-gaming)' },
    { id: 'hobby', label: 'Hobby', emoji: '🎨', color: 'var(--color-category-hobby)' },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: 'var(--color-category-shopping)' },
    { id: 'hangout', label: 'Hangout', emoji: '👋', color: 'var(--color-category-hangout)' },
    { id: 'other', label: 'Other', emoji: '📌', color: 'var(--color-text-secondary)' },
]

export const INTEREST_OPTIONS = [
    'Movies', 'Food', 'Cafés', 'Travel', 'Exploring', 'Sports', 'Gaming',
    'Study', 'Art', 'Music', 'Photography', 'Shopping', 'Events',
    'Technology', 'Outdoors', 'Hangout',
]

export const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

export const AVATAR_OPTIONS = [
    { id: 'male-1', gender: 'male', label: 'Anime avatar 1', url: '/avatars/anime-male-1.svg' },
    { id: 'male-2', gender: 'male', label: 'Anime avatar 2', url: '/avatars/anime-male-2.svg' },
    { id: 'male-3', gender: 'male', label: 'Anime avatar 3', url: '/avatars/anime-male-3.svg' },
    { id: 'female-1', gender: 'female', label: 'Anime avatar 4', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Yuki&backgroundColor=ffd5dc' },
    { id: 'female-2', gender: 'female', label: 'Anime avatar 5', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Sakura&backgroundColor=ffdfbf' },
    { id: 'female-3', gender: 'female', label: 'Anime avatar 6', url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Emi&backgroundColor=fde68a' },
]

export const MAX_PARTICIPANT_OPTIONS = [2, 3, 4, 5, 6, 10]

export const REPORT_REASONS = [
    'Inappropriate behavior',
    'Harassment',
    'Spam',
    'Fake profile',
    'Unsafe behavior',
    'Other',
]

export function getCategoryById(id) {
    return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

export function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date()
    tomorrow.setDate(today.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function calculateAge(dob) {
    if (!dob) return null
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
}

export function getGreeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

export function truncate(str, max = 100) {
    if (!str || str.length <= max) return str
    return str.slice(0, max) + '...'
}
