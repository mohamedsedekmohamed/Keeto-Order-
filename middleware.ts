import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Match:
  // /home/restaurants/:slug
  // /home/restaurants/:slug/restaurant
  // /home/restaurants/:slug/e-menu
  const match = pathname.match(
    /^\/home\/restaurants\/([^/]+)(\/.*)?$/
  );

  if (!match) {
    return NextResponse.next();
  }

  const slug = match[1];
  const rest = match[2] || "";

  // لو الـ UUID already موجود متعملش rewrite تاني
  const uuidPattern =
    /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

  if (uuidPattern.test(rest)) {
    return NextResponse.next();
  }

  let uuid: string | undefined;

  // ---------------- Cookie Fast Path ----------------
  const cookieValue = request.cookies.get("slug-map")?.value;

  if (cookieValue) {
    try {
      const slugMap: Record<string, string> =
        JSON.parse(cookieValue);

      uuid = slugMap[slug];
    } catch (err) {
      console.error("Cookie parse error:", err);
    }
  }

  // ---------------- API Fallback ----------------
  if (!uuid) {
    try {
      // convert:
      // mataam-wast-albalad
      // => mataam wast albalad
      const searchQuery = slug.replace(/-/g, " ");

      const apiRes = await fetch(
        `https://keetobcknd.keeto.org/api/user/home/search?query=${encodeURIComponent(
          searchQuery
        )}`,
        {
          cache: "no-store",
        }
      );

      if (apiRes.ok) {
        const json = await apiRes.json();

        uuid = json?.data?.data?.[0]?.id;
      }
    } catch (err) {
      console.error("Restaurant search error:", err);
    }
  }

  // لو ملقيناش المطعم سيبه يعدي
  // الصفحة نفسها تتعامل مع الحالة
  if (!uuid) {
    return NextResponse.next();
  }

  // rewrite داخلي بدون تغيير URL للمستخدم
  return NextResponse.rewrite(
    new URL(
      `/home/restaurants/${slug}/${uuid}${rest}`,
      request.url
    )
  );
}

export const config = {
  matcher: ["/home/restaurants/:path*"],
};