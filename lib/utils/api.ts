/**
 * Helper to determine the correct WordPress API URL
 * Handles the difference between client-side (CORS proxy) and server-side requests
 */
export function getWordPressApiUrl(): string {
    // If we're on the client side, use the proxy to avoid CORS issues
    if (typeof window !== 'undefined') {
        return '/api/proxy';
    }

    // If we're on the server side, use the direct URL
    // Fallback to the production URL if env var is not set
    return process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://admin.telasreal.com';
}
