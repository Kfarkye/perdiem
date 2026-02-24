// ━━━ SUPABASE CLIENT CONFIGURATION ━━━
// Two clients: browser-safe (anon key) for reads, server-only (service role) for writes.
// NEVER import createServiceClient in client components.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Public client — safe for browser and server reads.
 * Bound to anon key + RLS policies.
 * Note: Returns a dummy client during build-time data collection when env vars are missing.
 */
export const supabase: SupabaseClient = supabaseUrl
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient("https://placeholder.supabase.co", "placeholder-key");

/**
 * Server-only client — service role key bypasses RLS.
 * Use exclusively in API routes for trusted writes (pay_reports ingestion, etc.).
 * Throws immediately if called without SUPABASE_SERVICE_ROLE_KEY set.
 */
let _serviceClient: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
    if (_serviceClient) return _serviceClient;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        throw new Error(
            "SUPABASE_SERVICE_ROLE_KEY is not set. Server writes require the service role key."
        );
    }

    _serviceClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    return _serviceClient;
}
