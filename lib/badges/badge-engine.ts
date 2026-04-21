import { prisma } from "@/lib/prisma";

export type BadgeInfo = { slug: string; label: string };

async function checkBadge(
  slug: string,
  userId: string,
  stats: {
    reviewCount: number;
    uniqueRestaurantCount: number;
    followerCount: number;
  }
): Promise<boolean> {
  switch (slug) {
    case "first-review":
      return stats.reviewCount >= 1;

    case "frequent-reviewer":
      return stats.reviewCount >= 10;

    case "official-critic":
      return stats.reviewCount >= 50;

    case "neighborhood-voice": {
      if (stats.reviewCount < 5) return false;
      const reviews = await prisma.review.findMany({
        where: { userId },
        include: { restaurant: { select: { address: true } } },
      });
      const counts: Record<string, number> = {};
      for (const r of reviews) {
        const parts = r.restaurant.address.split(",").map((s) => s.trim());
        const key = parts[parts.length - 1] || parts[0] || "?";
        counts[key] = (counts[key] ?? 0) + 1;
      }
      return Math.max(0, ...Object.values(counts)) >= 5;
    }

    case "influencer":
      return stats.followerCount >= 20;

    case "opinion-maker": {
      const count = await prisma.mediaLike.count({
        where: { media: { review: { userId } } },
      });
      return count >= 50;
    }

    case "curator":
      return false; // Lists feature not yet implemented

    case "explorer":
      return stats.uniqueRestaurantCount >= 20;

    case "eclectic": {
      const tags = await prisma.reviewVibeTag.findMany({
        where: { review: { userId } },
        select: { vibeTagId: true },
        distinct: ["vibeTagId"],
      });
      return tags.length >= 8;
    }

    case "pioneer": {
      const userRestaurants = await prisma.review.findMany({
        where: { userId },
        select: { restaurantId: true, createdAt: true },
        distinct: ["restaurantId"],
        orderBy: { createdAt: "asc" },
      });
      let count = 0;
      for (const ur of userRestaurants) {
        const earlier = await prisma.review.findFirst({
          where: {
            restaurantId: ur.restaurantId,
            createdAt: { lt: ur.createdAt },
          },
          select: { id: true },
        });
        if (!earlier) {
          count++;
          if (count >= 3) return true;
        }
      }
      return count >= 3;
    }

    default:
      return false;
  }
}

export async function checkAndAwardBadges(userId: string): Promise<BadgeInfo[]> {
  const [allBadges, earnedIds] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge
      .findMany({ where: { userId }, select: { badgeId: true } })
      .then((rows) => new Set(rows.map((r) => r.badgeId))),
  ]);

  const missing = allBadges.filter((b) => !earnedIds.has(b.id));
  if (missing.length === 0) return [];

  const [reviewCount, uniqueRestaurantGroups, followerCount] =
    await Promise.all([
      prisma.review.count({ where: { userId } }),
      prisma.review.groupBy({ by: ["restaurantId"], where: { userId } }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);

  const stats = {
    reviewCount,
    uniqueRestaurantCount: uniqueRestaurantGroups.length,
    followerCount,
  };

  const newlyEarned: BadgeInfo[] = [];
  for (const badge of missing) {
    if (await checkBadge(badge.slug, userId, stats)) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      newlyEarned.push({ slug: badge.slug, label: badge.label });
    }
  }

  return newlyEarned;
}
