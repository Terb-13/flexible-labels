import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const demoSession = request.cookies.get("flg_demo_session")?.value;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (path.startsWith("/portal") && !path.startsWith("/portal/login") && !demoSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/operations") && demoSession !== "employee") {
      const url = request.nextUrl.clone();
      url.pathname = demoSession ? "/portal" : "/portal/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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

  if (path.startsWith("/portal") && !path.startsWith("/portal/login")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/operations")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "employee") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
