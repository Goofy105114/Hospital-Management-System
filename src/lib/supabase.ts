import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
);

// Global Supabase client instance
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Helper to authenticate user with Supabase Auth
 */
export async function signInWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured) {
    // Offline / Local development fallback
    return {
      data: {
        user: { id: `sb-${Date.now()}`, email },
        session: { access_token: `sb-token-${Date.now()}` },
      },
      error: null,
    };
  }
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Helper to sign up a new user in Supabase Auth
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  metadata?: Record<string, any>
) {
  if (!isSupabaseConfigured) {
    return {
      data: {
        user: { id: `sb-${Date.now()}`, email, user_metadata: metadata },
        session: { access_token: `sb-token-${Date.now()}` },
      },
      error: null,
    };
  }
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
}

/**
 * Helper to sign out from Supabase Auth
 */
export async function signOutFromSupabase() {
  if (!isSupabaseConfigured) {
    return { error: null };
  }
  return await supabase.auth.signOut();
}

/**
 * Helper to get current Supabase session
 */
export async function getSupabaseSession() {
  if (!isSupabaseConfigured) {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  return data.session;
}
