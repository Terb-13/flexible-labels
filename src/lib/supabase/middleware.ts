import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isPortalLogin = path === "/portal/login";
  const isOpsLogin = path === "/operations/login";
  const isPortalApp = path.startsWith("/portal") && !isPortalLogin;
  const isOpsApp = path.startsWith("/operations") && !isOpsLogin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

  let role: "customer" | "employee" | null = null;

  if (supabaseReady) {
    const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
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
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "customer" || profile?.role === "employee") {
        role = profile.role;
      }
    }
  }

  if (isOpsApp) {
    if (role === "employee") return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = role === "customer" ? "/portal" : "/operations/login";
    url.search = "";
    if (!role) url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isPortalApp) {
    if (role) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/portal/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isOpsLogin && role === "customer") {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isOpsLogin && role === "employee") {
    const url = request.nextUrl.clone();
    url.pathname = "/operations";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isPortalLogin && role === "customer") {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
