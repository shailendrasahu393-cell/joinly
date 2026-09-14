export const canUseBrowserNotifications = () => (
    typeof window !== 'undefined' && 'Notification' in window
)

export const requestBrowserNotificationPermission = async () => {
    if (!canUseBrowserNotifications()) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    return Notification.requestPermission()
}

export const showBrowserNotification = (title, options = {}) => {
    if (canUseBrowserNotifications() && Notification.permission === 'granted') {
        return new Notification(title, options)
    }
    return null
}
