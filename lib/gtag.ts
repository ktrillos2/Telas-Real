export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GTAG_ID
export const GA4_TRACKING_ID = process.env.NEXT_PUBLIC_GA4_ID

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
    if (typeof window !== "undefined" && window.gtag) {
        if (GA_TRACKING_ID) {
            window.gtag("config", GA_TRACKING_ID, { page_path: url })
        }
        if (GA4_TRACKING_ID) {
            window.gtag("config", GA4_TRACKING_ID, { page_path: url })
        }
    }
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (
    action: string,
    params?: { [key: string]: any }
) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", action, params)
    }
}

// Add empty interface for TS to not complain about gtag
declare global {
    interface Window {
        gtag: (...args: any[]) => void
    }
}
