import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Accept the URL however it was copied from the dashboard (e.g. ".../rest/v1/" or a trailing slash).
const url = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '')
  .trim()
  .replace(/\/(rest|auth)\/v1\/?$/, '')
  .replace(/\/+$/, '');
const key =
  (
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  )?.trim() ?? '';

/** False until VITE_SUPABASE_URL and the public (anon / publishable) key are set. */
export const isSupabaseConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

/** Shared Supabase client. Sessions are kept in localStorage and refreshed automatically. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  client ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storageKey: 'bloomcraft-auth',
    },
  });
  return client;
}

/** Turns a Supabase/PostgREST error into a message that is safe to show customers. */
export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;
  const e = error as { message?: string; code?: string; name?: string };
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'You seem to be offline. Please check your connection.';
  if (e.message && /failed to fetch|networkerror|load failed/i.test(e.message)) {
    return 'Could not reach the server. Please check your connection.';
  }
  if (e.message && /rate limit/i.test(e.message)) {
    return /email/i.test(e.message)
      ? 'Too many e-mails were sent in a short time. Please wait a few minutes, or sign in with your password.'
      : 'Too many attempts. Please wait a minute and try again.';
  }
  // Messages raised on purpose by our database functions (errcode P0001) and Supabase Auth
  // errors (wrong password, expired code, …) are written for people.
  if (e.message && (e.code === 'P0001' || e.name?.startsWith('Auth'))) return e.message;
  return fallback;
}
