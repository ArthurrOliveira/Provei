"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  if (process.env.BYPASS_AUTH === "true") {
    return {
      id: "preview-user",
      name: "Preview",
      email: "preview@mangut.dev",
      avatarUrl: null,
      createdAt: new Date(),
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });
    return dbUser;
  } catch {
    return null;
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
