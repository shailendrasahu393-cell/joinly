export function getGoogleMapsUrl(locationString) {
    if (!locationString || typeof locationString !== 'string' || !locationString.trim()) {
        return null;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationString.trim())}`;
}

export function getFullLocationString(plan) {
    if (!plan) return '';
    return [plan.locationName, plan.area, plan.city].filter(Boolean).join(', ');
}
