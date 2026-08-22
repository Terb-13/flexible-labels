export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Sample-account bypass. Never on Vercel (production or preview). Local only, or explicit flag. */
export function isDemoLoginAllowed(): boolean {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true") return true;
  if (process.env.VERCEL) return false;
  return !isSupabaseConfigured();
}
