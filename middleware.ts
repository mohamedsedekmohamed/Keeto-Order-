import { NextRequest, NextResponse } from "next/server";

const MAIN_HOSTS = ["orderfood.keeto.org", "localhost", "127.0.0.1"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const host = hostHeader.split(":")[0].toLowerCase().trim();

  // Support development/testing override via query param (?__custom_host=...) or cookie
  const testHost =
    request.nextUrl.searchParams.get("__custom_host") ||
    request.cookies.get("__custom_host")?.value;
  const effectiveHost = testHost ? testHost.toLowerCase().split(":")[0].trim() : host;

  const isCustomDomain = !!effectiveHost && !MAIN_HOSTS.includes(effectiveHost);

  // Skip static assets and internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------
  // Mode: Custom Domain (e.g. order.pizzaking.com or pizzaking.com)
  // -------------------------------------------------------------
  if (isCustomDomain) {
    // Resolve tenant from cookie cache or backend API
    const cookieKey = `tenant_${effectiveHost.replace(/[^a-z0-9_-]/g, "_")}`;
    let tenantData: { slug: string; id: string; name: string } | null = null;

    const cookieVal = request.cookies.get(cookieKey)?.value;
    if (cookieVal) {
      try {
        tenantData = JSON.parse(cookieVal);
      } catch {}
    }

    if (!tenantData) {
      try {
        const apiRes = await fetch(
          `https://keetobcknd.keeto.org/api/resolve-domain?host=${encodeURIComponent(effectiveHost)}`,
          { cache: "no-store" }
        );

        if (apiRes.ok) {
          const json = await apiRes.json();
          const resData = json?.data?.data || json?.data || json;
          const slug = resData.restaurantSlug || resData.slug;
          const id = resData.id;
          const name = resData.name;

          if (slug) {
            tenantData = { slug, id: id || "", name: name || "" };
          }
        }
      } catch (err) {
        console.error("Middleware resolve-domain error:", err);
      }
    }

    if (tenantData && tenantData.slug) {
      const slug = tenantData.slug;

      // When opening the root or main landing page on a custom domain,
      // don't open the main project page — go directly to domain/home/restaurants/:slug/restaurant
      if (pathname === "/" || pathname === "" || pathname === "/home") {
        const redirectRes = NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/restaurant`, request.url)
        );
        redirectRes.cookies.set(cookieKey, JSON.stringify(tenantData), {
          maxAge: 3600,
          path: "/",
        });
        return redirectRes;
      }

      // Handle shortcuts on custom domains
      if (pathname === "/restaurant") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/restaurant`, request.url)
        );
      }
      if (pathname === "/cart" || pathname === "/order") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/order`, request.url)
        );
      }
      if (pathname === "/checkout" || pathname === "/pay") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/pay`, request.url)
        );
      }
      if (pathname === "/menu") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/menu`, request.url)
        );
      }
      if (pathname === "/e-menu") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/e-menu`, request.url)
        );
      }
      if (pathname === "/address") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/address`, request.url)
        );
      }
      if (pathname === "/policy") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/policy`, request.url)
        );
      }
      if (pathname === "/refund") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/refund`, request.url)
        );
      }
      if (pathname === "/wallet") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/wallet`, request.url)
        );
      }
      if (pathname === "/offer") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/offer`, request.url)
        );
      }
      if (pathname === "/profile") {
        return NextResponse.redirect(
          new URL(`/home/restaurants/${slug}/profile`, request.url)
        );
      }
    }
  }

  // -------------------------------------------------------------
  // Mode: Main Domain Shortcuts (e.g. /order, /cart)
  // -------------------------------------------------------------
  if (!isCustomDomain) {
    if (pathname === "/order" || pathname === "/cart") {
      const referer = request.headers.get("referer");
      if (referer) {
        const refMatch = referer.match(/\/home\/restaurants\/([^/?#]+)/);
        if (refMatch && refMatch[1]) {
          return NextResponse.redirect(
            new URL(`/home/restaurants/${refMatch[1]}/order`, request.url)
          );
        }
      }
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  // -------------------------------------------------------------
  // Match: /home/restaurants/:slug
  // Runs for both custom domains and main domain
  // -------------------------------------------------------------
  const match = pathname.match(/^\/home\/restaurants\/([^/]+)(\/.*)?$/);

  if (match) {
    const slug = match[1];
    const rest = match[2] || "";

    // If UUID is already in the path, skip rewriting
    const uuidPattern =
      /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

    if (!uuidPattern.test(rest)) {
      let uuid: string | undefined;

      // 1. Cookie Fast Path
      const cookieValue = request.cookies.get("slug-map")?.value;
      if (cookieValue) {
        try {
          const slugMap: Record<string, { id: string; originalName: string }> =
            JSON.parse(cookieValue);
          if (slugMap[slug]) {
            uuid = slugMap[slug].id;
          }
        } catch (err) {
          console.error("Cookie parse error:", err);
        }
      }

      // 2. API Fallback
      if (!uuid) {
        try {
          let searchQuery = decodeURIComponent(slug).replace(/-/g, " ").trim();
          searchQuery = searchQuery.replace(/\b\w/g, (char) => char.toUpperCase());

          const apiRes = await fetch(
            `https://keetobcknd.keeto.org/api/user/home/search?query=${encodeURIComponent(searchQuery)}`,
            { cache: "no-store" }
          );

          if (apiRes.ok) {
            const json = await apiRes.json();
            uuid = json?.data?.data?.[0]?.id;
          }
        } catch (err) {
          console.error("Restaurant search error:", err);
        }
      }

      if (uuid) {
        return NextResponse.rewrite(
          new URL(`/home/restaurants/${slug}/${uuid}${rest}`, request.url)
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
