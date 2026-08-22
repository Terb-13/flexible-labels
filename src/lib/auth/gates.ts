export type AuthRedirect = {
  pathname: string;
  next?: string;
};

function isPortalPath(path: string) {
  return path === "/portal" || path.startsWith("/portal/");
}

function isOperationsPath(path: string) {
  return path === "/operations" || path.startsWith("/operations/");
}

export function isPortalLoginPath(path: string) {
  return path === "/portal/login" || path.startsWith("/portal/login/");
}

export function isOperationsLoginPath(path: string) {
  return path === "/operations/login" || path.startsWith("/operations/login/");
}

export function resolveAuthRedirect(input: {
  path: string;
  supabaseConfigured: boolean;
  demoSession?: string | null;
  userId?: string | null;
  role?: string | null;
}): AuthRedirect | null {
  const { path, supabaseConfigured, demoSession, userId, role } = input;

  if (supabaseConfigured) {
    if (isPortalLoginPath(path)) {
      if (userId) {
        return { pathname: "/portal" };
      }
      return null;
    }

    if (isOperationsLoginPath(path)) {
      if (userId && role === "employee") {
        return { pathname: "/operations" };
      }
      if (userId) {
        return { pathname: "/portal" };
      }
      return null;
    }

    if (isPortalPath(path)) {
      if (!userId) {
        return { pathname: "/portal/login", next: path };
      }
      return null;
    }

    if (isOperationsPath(path)) {
      if (!userId) {
        return { pathname: "/operations/login", next: path };
      }
      if (role !== "employee") {
        return { pathname: "/portal" };
      }
      return null;
    }

    return null;
  }

  if (isPortalLoginPath(path) || isOperationsLoginPath(path)) {
    return null;
  }

  if (isPortalPath(path)) {
    if (!demoSession) {
      return { pathname: "/portal/login", next: path };
    }
    return null;
  }

  if (isOperationsPath(path)) {
    if (demoSession === "employee") {
      return null;
    }
    if (demoSession) {
      return { pathname: "/portal" };
    }
    return { pathname: "/operations/login", next: path };
  }

  return null;
}

export function applyRedirectSearch(
  url: URL,
  redirect: AuthRedirect
): URL {
  url.pathname = redirect.pathname;
  if (redirect.next) {
    url.searchParams.set("next", redirect.next);
  } else {
    url.searchParams.delete("next");
  }
  return url;
}
