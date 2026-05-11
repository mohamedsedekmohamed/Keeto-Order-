import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const match = pathname.match(/^\/home\/restaurants\/([^/]+)(\/.*)?$/)
  if (!match) return NextResponse.next()

  const slug = match[1]
  const rest = match[2] || ""

  // If UUID already present → already rewritten, let it through
  const uuidPattern = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  if (uuidPattern.test(rest)) return NextResponse.next()

  // Try cookie first (fast path)
  let uuid: string | undefined
  const cookieValue = request.cookies.get("slug-map")?.value

  if (cookieValue) {
    try {
      const slugMap: Record<string, string> = JSON.parse(cookieValue)
      uuid = slugMap[slug]
    } catch {}
  }

  // Cookie miss → fetch from API (direct link / first visit)
  if (!uuid) {
    try {
      const apiRes = await fetch(
        `https://keetobcknd.keeto.org/api/user/home/search?query=${slug}`
      )
      if (apiRes.ok) {
        const json = await apiRes.json()
        uuid = json?.data?.data?.[0]?.id
      }
    } catch {}
  }

  if (!uuid) return NextResponse.next()

  return NextResponse.rewrite(
    new URL(`/home/restaurants/${slug}/${uuid}${rest}`, request.url)
  )
}

export const config = {
  matcher: ["/home/restaurants/:slug*"],
}