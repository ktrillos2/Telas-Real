export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export const pageview = () => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "PageView")
    }
}

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options = {}) => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", name, options)
    }
}
