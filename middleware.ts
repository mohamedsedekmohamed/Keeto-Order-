import { NextRequest, NextResponse } from "next/server";

const MAIN_HOSTS = ["orderfood.keeto.org", "localhost", "127.0.0.1"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  const host = hostHeader.split(":")[0].toLowerCase().trim();

  // Check for test override e.g. ?__custom_host=order.pizzaking.com
  const testHost = request.nextUrl.searchParams.get("__custom_host");
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
    // In custom mode, routes outside the restaurant (home, restaurant list, etc.) must not be reachable. Redirect them to /.
    if (
      pathname === "/home" ||
      pathname.startsWith("/home/categories") ||
      pathname.startsWith("/home/cuisines") ||
      pathname.startsWith("/home/Contact") ||
      pathname.startsWith("/home/AboutUs") ||
      pathname.startsWith("/home/TermsOfconditons") ||
      pathname.startsWith("/home/refund") ||
      pathname.startsWith("/home/restaurants")
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Resolve tenant from cookie cache or backend API
    const cookieKey = `tenant_${effectiveHost.replace(/[^a-z0-9_-]/g, "_")}`;
    let tenantData: { slug: string; id: string; name: string } | null = null;

    const cookieVal = request.cookies.get(cookieKey)?.value;
    if (cookieVal) {
      try {
        tenantData = JSON.parse(cookieVal);
      } catch { }
    }

    if (!tenantData) {
      try {
        const apiRes = await fetch(
          `https://keetobcknd.keeto.org/api/resolve-domain?host=${encodeURIComponent(effectiveHost)}`,
          { cache: "no-store" },
        );

        if (apiRes.ok) {
          const json = await apiRes.json();
          const resData = json?.data?.data || json?.data || json;
          const slug = resData.restaurantSlug || resData.slug;
          const id = resData.id;
          const name = resData.name;

          if (slug && id) {
            tenantData = { slug, id, name };
          }
        }
      } catch (err) {
        console.error("Middleware resolve-domain error:", err);
      }
    }

    // If tenant could not be resolved (404 or network error), let the request pass
    // to the page where TenantProvider renders the 404 or retry screen.
    if (!tenantData) {
      return NextResponse.next();
    }

    const { slug, id } = tenantData;
    let targetPath = `/home/restaurants/${slug}/${id}/restaurant`;

    if (pathname === "/" || pathname === "" || pathname === "/restaurant") {
      targetPath = `/home/restaurants/${slug}/${id}/restaurant`;
    } else if (pathname === "/cart" || pathname === "/order") {
      targetPath = `/home/restaurants/${slug}/${id}/order`;
    } else if (pathname === "/checkout" || pathname === "/pay") {
      targetPath = `/home/restaurants/${slug}/${id}/pay`;
    } else if (pathname === "/menu") {
      targetPath = `/home/restaurants/${slug}/${id}/menu`;
    } else if (pathname === "/e-menu") {
      targetPath = `/home/restaurants/${slug}/${id}/e-menu`;
    } else if (pathname === "/address") {
      targetPath = `/home/restaurants/${slug}/${id}/address`;
    } else if (pathname === "/policy") {
      targetPath = `/home/restaurants/${slug}/${id}/policy`;
    } else if (pathname === "/refund") {
      targetPath = `/home/restaurants/${slug}/${id}/refund`;
    } else if (pathname === "/wallet") {
      targetPath = `/home/restaurants/${slug}/${id}/wallet`;
    } else if (pathname === "/offer") {
      targetPath = `/home/restaurants/${slug}/${id}/offer`;
    } else if (pathname === "/cuisines") {
      targetPath = `/home/restaurants/${slug}/${id}/cuisines`;
    } else if (pathname === "/Fav" || pathname === "/fav") {
      targetPath = `/home/restaurants/${slug}/${id}/Fav`;
    } else if (pathname === "/notification") {
      targetPath = `/home/restaurants/${slug}/${id}/notification`;
    } else if (pathname === "/profile") {
      targetPath = `/home/restaurants/${slug}/${id}/profile`;
    } else if (pathname === "/auth/sign-in") {
      targetPath = `/auth/sign-in?callbackSlug=${slug}`;
    } else if (pathname === "/auth/sign-up") {
      targetPath = `/auth/sign-up?callbackSlug=${slug}`;
    } else {
      targetPath = `/home/restaurants/${slug}/${id}${pathname}`;
    }

    const response = NextResponse.rewrite(new URL(targetPath, request.url));
    response.cookies.set(cookieKey, JSON.stringify(tenantData), {
      maxAge: 3600,
      path: "/",
    });
    response.headers.set("x-tenant-mode", "custom");
    response.headers.set("x-tenant-slug", slug);
    return response;
  }

  // -------------------------------------------------------------
  // Mode: Path (orderfood.keeto.org or localhost)
  // -------------------------------------------------------------
  // Match: /home/restaurants/:slug
  const match = pathname.match(/^\/home\/restaurants\/([^/]+)(\/.*)?$/);

  if (!match) {
    return NextResponse.next();
  }

  const slug = match[1];
  const rest = match[2] || "";

  // If UUID is already in the path, skip rewriting
  const uuidPattern =
    /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

  if (uuidPattern.test(rest)) {
    return NextResponse.next();
  }

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
        { cache: "no-store" },
      );

      if (apiRes.ok) {
        const json = await apiRes.json();
        uuid = json?.data?.data?.[0]?.id;
      }
    } catch (err) {
      console.error("Restaurant search error:", err);
    }
  }

  if (!uuid) {
    return NextResponse.next();
  }

  return NextResponse.rewrite(
    new URL(`/home/restaurants/${slug}/${uuid}${rest}`, request.url),
  );
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
