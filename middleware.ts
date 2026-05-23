import { NextRequest, NextResponse } from "next/server";

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''`]/g, "")         // remove apostrophes: Masa'id → masaid
    .replace(/&/g, "and")          // & → and
    .replace(/[^a-z0-9\s]/g, " ")  // special chars → space
    .trim()
    .replace(/\s+/g, "-");         // spaces → single dash
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const match = pathname.match(/^\/home\/restaurants\/([^/]+)(\/.*)?$/);
  if (!match) return NextResponse.next();

  const slug = match[1];
  const rest = match[2] || "";

  // If UUID already present → already rewritten, let it through
  const uuidPattern =
    /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
  if (uuidPattern.test(rest)) return NextResponse.next();

  let uuid: string | undefined;

  // ---------------- Cookie Fast Path ----------------
  const cookieValue = request.cookies.get("slug-map")?.value;
  if (cookieValue) {
    try {
      const slugMap: Record<string, string> = JSON.parse(cookieValue);
      uuid = slugMap[slug];
    } catch (err) {
      console.error("Cookie parse error:", err);
    }
  }

  // ---------------- API Fallback ----------------
  if (!uuid) {
    try {
      // Fetch ALL restaurants with empty query
      const apiRes = await fetch(
        `https://keetobcknd.keeto.org/api/user/home/search?query=`,
        { cache: "no-store" }
      );

      if (apiRes.ok) {
        const json = await apiRes.json();
        const restaurants: { id: string; name: string }[] =
          json?.data?.data || [];

        // Find best match by comparing normalized slugs
        const matched = restaurants.find(
          (r) => toSlug(r.name) === toSlug(slug)
        );

        if (matched) {
          uuid = matched.id;
        }
      }
    } catch (err) {
      console.error("Restaurant search error:", err);
    }
  }

  if (!uuid) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.rewrite(
    new URL(`/home/restaurants/${slug}/${uuid}${rest}`, request.url)
  );
}

export const config = {
  matcher: ["/home/restaurants/:path*"],
};