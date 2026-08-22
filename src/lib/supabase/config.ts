export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isDemoLoginAllowed(): boolean {
  if (!isSupabaseConfigured()) return true;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true") return true;
  return process.env.NODE_ENV !== "production";
}
