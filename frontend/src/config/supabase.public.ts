/**
 * BloomCraft's Supabase project. Both values are PUBLIC by design: they are sent to every visitor's
 * browser anyway, and the database's row-level security decides what each person may read or change.
 * Never put a secret key (sb_secret_… / service_role) here.
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, when set, override these (e.g. for a test project).
 */
export const SUPABASE_PUBLIC = {
  url: 'https://wqlgszyfwapvptklomld.supabase.co',
  publishableKey: 'sb_publishable_-6bYgYjByL98xGoW24BBKw_WkVonUcr',
} as const;
