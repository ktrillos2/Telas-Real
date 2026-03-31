"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"
import { useEffect, Suspense } from "react"
import * as fpixel from "@/lib/fpixel"

function MetaPixelEvents() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        // This pageview only fires on route changes
        fpixel.pageview()
    }, [pathname, searchParams])

    return null
}

export function TrackingPixels() {
    return (
        <>
            <Suspense fallback={null}>
                <MetaPixelEvents />
            </Suspense>
            {/* Meta Pixel Code */}
            <Script
                id="fb-pixel"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fpixel.FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
                }}
            />
            {/* Fallback code for non-JS browsers */}
            <noscript>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src={`https://www.facebook.com/tr?id=${fpixel.FB_PIXEL_ID}&ev=PageView&noscript=1`}
                    alt=""
                />
            </noscript>

            {/* Google tag (gtag.js) */}
            <script
                async
                src="https://www.googletagmanager.com/gtag/js?id=AW-17322559312"
            ></script>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-17322559312');
          `,
                }}
            />

            {/* LinkedIn Insight Tag */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            _linkedin_partner_id = "8696962";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          `,
                }}
            />
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);})(window.lintrk);
          `,
                }}
            />
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    alt=""
                    src="https://px.ads.linkedin.com/collect/?pid=8696962&fmt=gif"
                />
            </noscript>

            {/* TikTok Pixel Code Start */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
            var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
            ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
             
              ttq.load('D6CCB3RC77U0SFL8ILIG');
              ttq.page();
            }(window, document, 'ttq');
          `,
                }}
            />
        </>
    )
}
