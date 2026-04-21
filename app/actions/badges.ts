"use server";

import { prisma } from "@/lib/prisma";

export type ProfileBadge = {
  id: string;
  slug: string;
  label: string;
  description: string;
  category: "REVIEWER" | "SOCIAL" | "EXPLORER";
  earned: boolean;
  earnedAt: Date | null;
  progress: { current: number; total: number };
};

export async function getProfileBadges(userId: string): Promise<ProfileBadge[]> {
  const [
    allBadges,
    userBadges,
    reviewCount,
    uniqueRestaurantGroups,
    followerCount,
    mediaLikeCount,
    uniqueVibeTagCount,
  ] = await Promise.all([
    prisma.badge.findMany({
      orderBy: [{ category: "asc" }, { label: "asc" }],
    }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, earnedAt: true },
    }),
    prisma.review.count({ where: { userId } }),
    prisma.review.groupBy({ by: ["restaurantId"], where: { userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.mediaLike.count({ where: { media: { review: { userId } } } }),
    prisma.reviewVibeTag
      .findMany({
        where: { review: { userId } },
        select: { vibeTagId: true },
        distinct: ["vibeTagId"],
      })
      .then((r) => r.length),
  ]);

  const uniqueRestaurantCount = uniqueRestaurantGroups.length;
  const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

  function progress(slug: string): { current: number; total: number } {
    switch (slug) {
      case "first-review":
        return { current: Math.min(reviewCount, 1), total: 1 };
      case "frequent-reviewer":
        return { current: Math.min(reviewCount, 10), total: 10 };
      case "official-critic":
        return { current: Math.min(reviewCount, 50), total: 50 };
      case "neighborhood-voice":
        return { current: Math.min(reviewCount, 5), total: 5 };
      case "influencer":
        return { current: Math.min(followerCount, 20), total: 20 };
      case "opinion-maker":
        return { current: Math.min(mediaLikeCount, 50), total: 50 };
      case "curator":
        return { current: 0, total: 5 };
      case "explorer":
        return { current: Math.min(uniqueRestaurantCount, 20), total: 20 };
      case "eclectic":
        return { current: Math.min(uniqueVibeTagCount, 8), total: 8 };
      case "pioneer":
        return { current: Math.min(uniqueRestaurantCount, 3), total: 3 };
      default:
        return { current: 0, total: 1 };
    }
  }

  return allBadges.map((badge) => ({
    id: badge.id,
    slug: badge.slug,
    label: badge.label,
    description: badge.description,
    category: badge.category as "REVIEWER" | "SOCIAL" | "EXPLORER",
    earned: earnedMap.has(badge.id),
    earnedAt: earnedMap.get(badge.id) ?? null,
    progress: progress(badge.slug),
  }));
}
