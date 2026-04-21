"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult, ReviewWithRelations, VibeTagCount } from "@/types";
import { checkAndAwardBadges, BadgeInfo } from "@/lib/badges/badge-engine";

const USER_WITH_BADGES_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  badges: { include: { badge: { select: { slug: true, label: true } } } },
} as const;

export async function createReview(data: {
  userId: string;
  restaurantId: string;
  rating?: number;
  comment: string;
  vibeTagIds: string[];
}): Promise<ActionResult<{ id: string; newBadges: BadgeInfo[] }>> {
  try {
    const review = await prisma.review.create({
      data: {
        userId: data.userId,
        restaurantId: data.restaurantId,
        rating: data.rating ?? null,
        comment: data.comment,
        vibeTags: {
          create: data.vibeTagIds.map((vibeTagId) => ({ vibeTagId })),
        },
      },
    });
    const newBadges = await checkAndAwardBadges(data.userId);
    return { success: true, data: { id: review.id, newBadges } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getReviewsByRestaurant(
  restaurantId: string
): Promise<ActionResult<ReviewWithRelations[]>> {
  try {
    const reviews = await prisma.review.findMany({
      where: { restaurantId },
      include: {
        user: { select: USER_WITH_BADGES_SELECT },
        restaurant: { select: { id: true, name: true, address: true } },
        vibeTags: { include: { vibeTag: true } },
        media: { include: { _count: { select: { likes: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: reviews as ReviewWithRelations[] };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getReviewsByRestaurantFiltered(
  restaurantId: string,
  userIds: string[]
): Promise<ActionResult<ReviewWithRelations[]>> {
  try {
    const reviews = await prisma.review.findMany({
      where: { restaurantId, userId: { in: userIds } },
      include: {
        user: { select: USER_WITH_BADGES_SELECT },
        restaurant: { select: { id: true, name: true, address: true } },
        vibeTags: { include: { vibeTag: true } },
        media: { include: { _count: { select: { likes: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: reviews as ReviewWithRelations[] };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getTopVibeTags(
  restaurantId: string
): Promise<ActionResult<VibeTagCount[]>> {
  try {
    const tags = await prisma.reviewVibeTag.groupBy({
      by: ["vibeTagId"],
      where: { review: { restaurantId } },
      _count: { vibeTagId: true },
      orderBy: { _count: { vibeTagId: "desc" } },
      take: 10,
    });

    const vibeTags = await prisma.vibeTag.findMany({
      where: { id: { in: tags.map((t) => t.vibeTagId) } },
    });

    const result = tags.map((t) => ({
      id: t.vibeTagId,
      label: vibeTags.find((v) => v.id === t.vibeTagId)?.label ?? "",
      count: t._count.vibeTagId,
    }));

    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getAllVibeTags() {
  try {
    const tags = await prisma.vibeTag.findMany({ orderBy: { label: "asc" } });
    return { success: true, data: tags };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function createQuickReview(data: {
  userId: string;
  restaurantId: string;
  vibeTagIds: string[];
  rating?: number;
}): Promise<ActionResult<{ id: string; newBadges: BadgeInfo[] }>> {
  try {
    if (data.vibeTagIds.length === 0) {
      return { success: false, error: "Selecione ao menos uma vibe tag" };
    }
    const review = await prisma.review.create({
      data: {
        userId: data.userId,
        restaurantId: data.restaurantId,
        rating: data.rating ?? null,
        comment: "",
        vibeTags: {
          create: data.vibeTagIds.map((vibeTagId) => ({ vibeTagId })),
        },
      },
    });
    const newBadges = await checkAndAwardBadges(data.userId);
    return { success: true, data: { id: review.id, newBadges } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
