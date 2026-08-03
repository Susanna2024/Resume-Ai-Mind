// Small helper around GTM's dataLayer, so components don't need to know
// about `window.dataLayer` directly. Safe to call even if GTM hasn't
// loaded yet (e.g. blocked by an ad-blocker) or in local dev without a
// container configured.

declare global {
    interface Window {
      dataLayer?: Record<string, unknown>[]
    }
  }
  
  export function trackEvent(event: string, params: Record<string, unknown> = {}) {
    if (typeof window === "undefined") return
  
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...params })
  }