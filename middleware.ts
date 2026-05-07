import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Match /home/restaurants/[slug] OR /home/restaurants/[slug]/anything...
  const match = pathname.match(/^\/home\/restaurants\/([^/]+)(\/.*)?$/)

  if (!match) return NextResponse.next()

  const slug = match[1]
  const rest = match[2] || "" // everything after slug, or empty

  // If UUID already present → already rewritten, let it through
  const uuidPattern = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  if (uuidPattern.test(rest)) return NextResponse.next()

  const cookieValue = request.cookies.get("slug-map")?.value
  if (!cookieValue) return NextResponse.next()

  let slugMap: Record<string, string> = {}
  try {
    slugMap = JSON.parse(cookieValue)
  } catch {
    return NextResponse.next()
  }

  const uuid = slugMap[slug]
  if (!uuid) return NextResponse.next()

  // Rewrite: /keeto/restaurant → /keeto/UUID/restaurant
  return NextResponse.rewrite(
    new URL(`/home/restaurants/${slug}/${uuid}${rest}`, request.url)
  )
}

export const config = {
  matcher: ["/home/restaurants/:slug*"],
}