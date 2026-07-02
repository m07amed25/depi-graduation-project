import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/admin",
  "/analytics",
  "/profile",
  "/repo",
  "/reviews",
  "/settings",
  "/teams",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check Maintenance Mode
  const isMaintenancePage = pathname === "/maintenance";
  const isApiRoute = pathname.startsWith("/api");

  // Use an explicit extension allowlist instead of `pathname.includes('.')`
  // to avoid false-positives on routes such as `/user.settings` or
  // `/repo/my.project` that contain a dot but are not static assets.
  const STATIC_EXTENSIONS =
    /\.(ico|png|jpg|jpeg|gif|webp|svg|js|mjs|css|woff|woff2|ttf|eot|map|json|txt|xml|csv)$/i;
  const isStaticFile =
    pathname.startsWith("/_next") || STATIC_EXTENSIONS.test(pathname);

  const isAppRoute = [
    "/repo",
    "/reviews",
    "/settings",
    "/teams",
    "/profile",
    "/analytics",
    "/admin",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // For app routes, fetch maintenance status and (when protected) the session in
  // parallel to avoid two sequential round-trips on every protected page load.
  if (isAppRoute && !isMaintenancePage && !isApiRoute && !isStaticFile) {
    const maintenanceUrl = new URL(
      "/api/system/maintenance",
      request.nextUrl.origin,
    );
    const sessionUrl = new URL("/api/auth/get-session", request.nextUrl.origin);
    const cookieHeader = request.headers.get("cookie") ?? "";

    const sessionCookie =
      request.cookies.get("better-auth.session_token")?.value ??
      request.cookies.get("__Secure-better-auth.session_token")?.value;

    const isValidSession =
      typeof sessionCookie === "string" &&
      sessionCookie.length >= 10 &&
      sessionCookie.length <= 4096 &&
      /^[a-zA-Z0-9\-_.~%+=/]+$/.test(sessionCookie);

    try {
      // Run maintenance check and session fetch in parallel.
      const [maintenanceData, sessionData] = await Promise.all([
        fetch(maintenanceUrl.toString()).then(
          (r) => r.json() as Promise<{ maintenanceMode?: boolean }>,
        ),
        isProtectedRoute && isValidSession
          ? fetch(sessionUrl.toString(), {
              headers: { cookie: cookieHeader },
            }).then((r) =>
              r.ok
                ? (r.json() as Promise<{
                    user?: { id?: string; role?: string };
                  } | null>)
                : null,
            )
          : Promise.resolve(null),
      ]);

      if (maintenanceData?.maintenanceMode) {
        if (sessionData?.user?.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/maintenance", request.url));
        }
      }

      if (isProtectedRoute) {
        if (!isValidSession) {
          return NextResponse.redirect(new URL("/sign-in", request.url));
        }
        if (!sessionData?.user) {
          return NextResponse.redirect(new URL("/sign-in", request.url));
        }
        // NOTE: We intentionally do NOT check the admin role here.
        // Better Auth's cookie cache can hold a stale role for up to 5
        // minutes after a promotion, causing newly promoted admins to be
        // incorrectly redirected. The server-side admin layout
        // (app/admin/layout.tsx) performs a fresh DB query for the role,
        // so the authorization is still enforced.
        return NextResponse.next();
      }
    } catch (e) {
      console.error("Middleware check failed:", e);
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
    }

    return NextResponse.next();
  }

  if (pathname === "/api/auth/error") {
    const error = request.nextUrl.searchParams.get("error") ?? "unknown";
    const linkErrors = new Set([
      "account_already_linked_to_different_user",
      "email_doesn't_match",
      "oauth_account_already_used",
    ]);

    const url = request.nextUrl.clone();
    if (linkErrors.has(error)) {
      url.pathname = "/profile";
      url.searchParams.set("auth_error", error);
    } else {
      url.pathname = "/auth-error";
      url.searchParams.set("error", error);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/webhooks|api/inngest|_next/static|_next/image|favicon.ico|images|.*\\\\.svg$).*)",
  ],
};
