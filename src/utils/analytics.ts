/**
 * Analytics event tracking placeholder ready for GA4 / Meta Pixel integration
 */
export type AnalyticsEventName =
  | 'view_item'
  | 'view_item_list'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'add_to_wishlist'
  | 'remove_from_wishlist'
  | 'begin_checkout'
  | 'select_delivery_method'
  | 'add_payment_info'
  | 'purchase'
  | 'custom_request_submitted'
  | 'whatsapp_click'
  | 'receipt_download'
  | 'track_order_lookup';

export function trackEvent(
  eventName: AnalyticsEventName,
  payload?: Record<string, any>
): void {
  try {
    if (typeof window !== 'undefined') {
      // In development / demo, we can log or emit a custom event
      if (import.meta.env?.DEV) {
        // console.debug(`[Analytics Event] ${eventName}:`, payload);
      }
      // If window.gtag exists, invoke it
      if ((window as any).gtag) {
        (window as any).gtag('event', eventName, payload);
      }
    }
  } catch {
    // Non-blocking analytics wrapper
  }
}
