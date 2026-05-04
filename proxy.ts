import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// In-memory rate limiter: 60 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 60) return true;
  entry.count++;
  return false;
}

const RATE_LIMITED_PREFIXES = [
  "/api/places/",
  "/restaurantes/",
  "/explore/",
  "/lists/",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit public routes that hit the DB or external APIs
  if (RATE_LIMITED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    if (isRateLimited(ip)) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/login" && user) {
    const feedUrl = request.nextUrl.clone();
    feedUrl.pathname = "/app/feed";
    return NextResponse.redirect(feedUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/app/:path*",
    "/login",
    "/api/places/:path*",
    "/restaurantes/:path*",
    "/explore/:path*",
    "/lists/:path*",
  ],
};
