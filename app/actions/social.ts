"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types";

export async function followUser(
  followerId: string,
  followingId: string
): Promise<ActionResult> {
  try {
    await prisma.follow.create({ data: { followerId, followingId } });
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
