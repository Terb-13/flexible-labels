export function isSupabaseConfigured(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
): boolean {
  return Boolean(url && anonKey);
}
