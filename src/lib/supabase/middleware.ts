import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { applyRedirectSearch, resolveAuthRedirect } from "@/lib/auth/gates";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const supabaseConfigured = isSupabaseConfigured();
  const demoSession = request.cookies.get("flg_demo_session")?.value;

  if (!supabaseConfigured) {
    const redirect = resolveAuthRedirect({
      path,
      supabaseConfigured: false,
      demoSession,
    });
    if (redirect) {
      const url = applyRedirectSearch(request.nextUrl.clone(), redirect);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const gated =
    path === "/portal" ||
    path.startsWith("/portal/") ||
    path === "/operations" ||
    path.startsWith("/operations/");

  let role: string | null = null;
  if (user && gated) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  // Production: flg_demo_session is not auth. Supabase user + role only.
  const redirect = resolveAuthRedirect({
    path,
    supabaseConfigured: true,
    demoSession,
    userId: user?.id ?? null,
    role,
  });

  if (redirect) {
    const url = applyRedirectSearch(request.nextUrl.clone(), redirect);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
