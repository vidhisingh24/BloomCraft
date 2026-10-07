/**
 * Corrections for sales made before the website, set by the maker. They are added on top of the
 * orders in the database so the Maker Studio shows the real figures; new orders still add normally.
 * Amounts are in paise (₹1 = 100).
 */
export const EARLIER_SALES_CORRECTION = {
  /** Added to the total of received sales (Overview "Received" and the Orders page total). */
  totalPaise: 5000,
  /** Added to a product's revenue in the Overview product breakdown, by item name. */
  byProductPaise: {
    'Handmade Crochet Keychain': 7000,
    'Handmade Crochet Waist Chain': 3000,
  } as Record<string, number>,
};
