"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult, FriendsWhoReviewedResult } from "@/types";
import { checkAndAwardBadges } from "@/lib/badges/badge-engine";
import { getTopBadge } from "@/lib/badges/badge-utils";

export async function followUser(
  followerId: string,
  followingId: string
): Promise<ActionResult> {
  try {
    await prisma.follow.create({ data: { followerId, followingId } });
    // Check if the person being followed unlocked influencer badge
    await checkAndAwardBadges(followingId);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<ActionResult> {
  try {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getFollowers(userId: string) {
  return prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

export async function getFollowing(userId: string) {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const follow = await prisma.follow.findFirst({
    where: { followerId, followingId },
  });
  return !!follow;
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  return follows.map((f) => f.followingId);
}

export async function getFriendsOfFriendsIds(
  userId: string
): Promise<string[]> {
  const friendIds = await getFriendIds(userId);
  if (friendIds.length === 0) return [];

  const fofFollows = await prisma.follow.findMany({
    where: {
      followerId: { in: friendIds },
      followingId: { not: userId },
    },
    select: { followingId: true },
    distinct: ["followingId"],
  });

  const fofIds = fofFollows
    .map((f) => f.followingId)
    .filter((id) => !friendIds.includes(id) && id !== userId);

  return [...new Set(fofIds)];
}

export async function searchUsers(query: string, currentUserId: string) {
  try {
    const users = await prisma.user.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        id: { not: currentUserId },
      },
      select: { id: true, name: true, avatarUrl: true, email: true },
      take: 20,
    });
    return { success: true, data: users };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        email: true,
        createdAt: true,
        _count: {
          select: { followers: true, following: true, reviews: true },
        },
      },
    });
    return { success: true, data: user };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getFriendsWhoReviewed(
  restaurantId: string,
  userId: string
): Promise<FriendsWhoReviewedResult> {
  const [directIds, fofIds, followCount] = await Promise.all([
    getFriendIds(userId),
    getFriendsOfFriendsIds(userId),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);

  const hasFriendsInApp = followCount > 0;
  const allIds = [...new Set([...directIds, ...fofIds, userId])];

  if (allIds.length === 0) {
    return {
      direct: [],
      fof: [],
      aggregates: { count: 0, avgRating: null, topVibeTags: [] },
      hasFriendsInApp,
    };
  }

  const reviews = await prisma.review.findMany({
    where: { restaurantId, userId: { in: allIds } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          badges: { include: { badge: { select: { slug: true, label: true } } } },
        },
      },
      vibeTags: { include: { vibeTag: { select: { label: true } } } },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
  });

  // One review per user — first encountered is highest-rated (due to sort)
  const byUser = new Map<string, (typeof reviews)[0]>();
  for (const r of reviews) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, r);
  }

  const directSet = new Set(directIds);
  const fofSet = new Set(fofIds);

  const toSummary = (r: (typeof reviews)[0], isSelf: boolean) => ({
    userId: r.user.id,
    name: r.user.name,
    avatarUrl: r.user.avatarUrl,
    rating: r.rating,
    comment: r.comment,
    vibeTags: r.vibeTags.map((vt) => vt.vibeTag.label),
    reviewId: r.id,
    isSelf,
    topBadge: getTopBadge(r.user.badges.map((ub) => ub.badge)),
  });

  const selfEntry = byUser.get(userId);
  const directEntries = [...byUser.values()].filter((r) =>
    directSet.has(r.userId)
  );
  const fofEntries = [...byUser.values()].filter((r) => fofSet.has(r.userId));

  // Self appears first in the direct list
  const direct = [
    ...(selfEntry ? [toSummary(selfEntry, true)] : []),
    ...directEntries.map((r) => toSummary(r, false)),
  ];
  const fof = fofEntries.map((r) => toSummary(r, false));

  // Aggregates over direct friends + self
  const forAgg = selfEntry ? [selfEntry, ...directEntries] : directEntries;
  const ratings = forAgg.map((r) => r.rating).filter((v): v is number => v !== null);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;

  const tagCounts: Record<string, number> = {};
  forAgg.forEach((r) => {
    r.vibeTags.forEach((vt) => {
      tagCounts[vt.vibeTag.label] = (tagCounts[vt.vibeTag.label] ?? 0) + 1;
    });
  });
  const topVibeTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

  return {
    direct,
    fof,
    aggregates: { count: forAgg.length, avgRating, topVibeTags },
    hasFriendsInApp,
  };
}
