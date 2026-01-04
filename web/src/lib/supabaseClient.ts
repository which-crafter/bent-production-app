/**
 * Supabase client initialization.
 * 
 * Creates a single Supabase client instance using environment variables.
 * Throws at module load time if required env vars are missing (fail-fast).
 * 
 * Note: Uses anon key (no RLS/auth in current implementation).
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

