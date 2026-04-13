import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/app/feed";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
            avatarUrl: user.user_metadata?.avatar_url ?? null,
          },
          create: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
            avatarUrl: user.user_metadata?.avatar_url ?? null,
          },
        });
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", requestUrl.origin));
}
