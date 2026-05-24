// import { NextRequest, NextResponse } from "next/server";

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   console.log("MIDDLEWARE RUNNING:", pathname);
//   // Match:
//   // /home/restaurants/:slug
//   // /home/restaurants/:slug/restaurant
//   // /home/restaurants/:slug/e-menu
//   const match = pathname.match(/^\/home\/restaurants\/([^/]+)(\/.*)?$/);

//   if (!match) {
//     return NextResponse.next();
//   }

//   const slug = match[1];
//   const rest = match[2] || "";

//   // لو الـ UUID already موجود متعملش rewrite تاني
//   const uuidPattern =
//     /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

//   if (uuidPattern.test(rest)) {
//     return NextResponse.next();
//   }

//   let uuid: string | undefined;

//   // ---------------- Cookie Fast Path ----------------
//   const cookieValue = request.cookies.get("slug-map")?.value;

//   if (cookieValue) {
//     try {
//       const slugMap: Record<string, string> = JSON.parse(cookieValue);

//       uuid = slugMap[slug];
//     } catch (err) {
//       console.error("Cookie parse error:", err);
//     }
//   }

//   // ---------------- API Fallback ----------------
//   if (!uuid) {
//     try {
//       // const searchQuery = slug.replace(/-+/g, " ").trim();
//       const apiRes = await fetch(
//         `https://keetobcknd.keeto.org/api/user/home/search?query=${slug}`,
//         { cache: "no-store" },
//       );

//       if (apiRes.ok) {
//         const json = await apiRes.json();
//         uuid = json?.data?.data?.[0]?.id;
//       }
//     } catch (err) {
//       console.error("Restaurant search error:", err);
//     }
//   }
//   // لو ملقيناش المطعم سيبه يعدي
//   // الصفحة نفسها تتعامل مع الحالة
//   if (!uuid) {
//     return NextResponse.next();
//   }

//   // rewrite داخلي بدون تغيير URL للمستخدم
//   return NextResponse.rewrite(
//     new URL(`/home/restaurants/${slug}/${uuid}${rest}`, request.url),
//   );
// }

// export const config = {
//   matcher: ["/home/restaurants/:path*"],
// };


import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. فك التشفير للتعامل مع الـ Match والكوكيز والـ API بالحروف العربية الطبيعية
  const decodedPathname = decodeURIComponent(request.nextUrl.pathname);
  console.log("MIDDLEWARE RUNNING:", decodedPathname);

  const match = decodedPathname.match(/^\/home\/restaurants\/([^/]+)(\/.*)?$/);

  if (!match) {
    return NextResponse.next();
  }

  const slug = match[1];
  const rest = match[2] || "";

  // إذا كان الـ UUID موجوداً بالفعل في الرابط، لا تقم بعمل rewrite مجدداً
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
      const slugMap: Record<string, string> = JSON.parse(cookieValue);
      uuid = slugMap[slug];
    } catch (err) {
      console.error("Cookie parse error:", err);
    }
  }

  // ---------------- API Fallback ----------------
  if (!uuid) {
    try {
      // نمرر الـ slug مشفراً للـ API لضمان وصول الحروف العربية بشكل صحيح للسيرفر الخارجي
      const apiRes = await fetch(
        `https://keetobcknd.keeto.org/api/user/home/search?query=${encodeURIComponent(slug)}`,
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

  // إذا لم نجد الـ UUID اترك المسار يمر والصفحة ستتعامل مع الـ 404
  if (!uuid) {
    return NextResponse.next();
  }

  // 2. خطوة الـ Rewrite الحريصة (مهمة جداً للـ Production):
  // نقوم بتشفير الـ slug مجدداً هنا فقط ليقرأه سيرفر Next.js Production بدون مشاكل 404
  const safeSlug = encodeURIComponent(slug);
  
  // بناء الرابط الداخلي الموجه للمجلد [slug]/[id]
  const destinationUrl = new URL(
    `/home/restaurants/${safeSlug}/${uuid}${rest}`,
    request.url
  );

  return NextResponse.rewrite(destinationUrl);
}

export const config = {
  matcher: ["/home/restaurants/:path*"],
};