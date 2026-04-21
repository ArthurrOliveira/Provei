"use server";

import { prisma } from "@/lib/prisma";
import { getFriendIds, getFriendsOfFriendsIds } from "./social";
import { ReviewWithRelations } from "@/types";

const USER_WITH_BADGES_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  badges: { include: { badge: { select: { slug: true, label: true } } } },
} as const;

export async function getFeed(params: {
  userId: string;
  mode: "friends" | "fof";
  vibeTagIds?: string[];
  cursor?: string;
  limit?: number;
}): Promise<{ reviews: ReviewWithRelations[]; nextCursor: string | null }> {
  const { userId, mode, vibeTagIds = [], cursor, limit = 10 } = params;

  const authorIds =
    mode === "friends"
      ? await getFriendIds(userId)
      : await getFriendsOfFriendsIds(userId);

  const where: Record<string, unknown> = {
    userId: { in: authorIds },
  };

  if (vibeTagIds.length > 0) {
    where.vibeTags = {
      some: { vibeTagId: { in: vibeTagIds } },
    };
  }

  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: USER_WITH_BADGES_SELECT },
      restaurant: { select: { id: true, name: true, address: true } },
      vibeTags: { include: { vibeTag: true } },
      media: {
        take: 1,
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { likes: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
  });

  const hasMore = reviews.length > limit;
  const items = hasMore ? reviews.slice(0, limit) : reviews;
  const nextCursor = hasMore
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return { reviews: items as ReviewWithRelations[], nextCursor };
}
