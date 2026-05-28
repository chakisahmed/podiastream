import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login"];
const TOKEN_COOKIE = "podiastream_token";

export async function proxy(request: NextRequest) {
  // Optimistic check only (cookie presence) — the DRF API re-validates the
  // token on every request, this is just to avoid flashing protected pages.
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!hasToken && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasToken && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
