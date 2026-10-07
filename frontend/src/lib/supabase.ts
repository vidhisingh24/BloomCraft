import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLIC } from '../config/supabase.public';

/** Env values pasted into hosting dashboards often keep their quote marks or spaces: drop them. */
const clean = (value: string | undefined) => (value ?? '').trim().replace(/^["']+|["']+$/g, '').trim();

// Accept the URL however it was copied from the dashboard (e.g. ".../rest/v1/" or a trailing slash).
const envUrl = clean(import.meta.env.VITE_SUPABASE_URL as string | undefined)
  .replace(/\/(rest|auth)\/v1\/?$/, '')
  .replace(/\/+$/, '');
const envKey =
  clean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  clean(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

// A malformed dashboard value must never take the site down: fall back to the built-in project.
const url = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(envUrl) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(envUrl)
  ? envUrl
  : SUPABASE_PUBLIC.url;
const key = envKey && url === envUrl ? envKey : SUPABASE_PUBLIC.publishableKey;

/** False only if both the project URL and its public key are missing. */
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
  // Keep the technical reason in the browser console (F12) for troubleshooting.
  console.warn('[BloomCraft]', error);
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
