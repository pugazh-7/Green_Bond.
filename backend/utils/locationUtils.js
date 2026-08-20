export const LAUNCH_CENTER = {
    latitude: process.env.LAUNCH_CENTER_LAT ? parseFloat(process.env.LAUNCH_CENTER_LAT) : 12.2253, // Thiruvannamalai default
    longitude: process.env.LAUNCH_CENTER_LNG ? parseFloat(process.env.LAUNCH_CENTER_LNG) : 79.0747
};

export const SERVICE_RADIUS_KM = process.env.SERVICE_RADIUS_KM ? parseFloat(process.env.SERVICE_RADIUS_KM) : 10;

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Checks if the given coordinates are within the service area.
 */
export function isWithinServiceArea(latitude, longitude) {
    if (!latitude || !longitude) return false;
    const distance = calculateDistance(LAUNCH_CENTER.latitude, LAUNCH_CENTER.longitude, latitude, longitude);
    return distance <= SERVICE_RADIUS_KM;
}
