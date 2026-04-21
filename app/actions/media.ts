"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types";
import { checkAndAwardBadges } from "@/lib/badges/badge-engine";

export async function createReviewMedia(data: {
  reviewId: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  thumbnailUrl?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const media = await prisma.reviewMedia.create({
      data: {
        reviewId: data.reviewId,
        url: data.url,
        type: data.type,
        thumbnailUrl: data.thumbnailUrl ?? null,
      },
    });
    return { success: true, data: { id: media.id } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function toggleMediaLike(
  userId: string,
  mediaId: string
): Promise<ActionResult<{ liked: boolean; count: number }>> {
  try {
    const existing = await prisma.mediaLike.findFirst({
      where: { userId, mediaId },
    });

    if (existing) {
      await prisma.mediaLike.delete({
        where: { userId_mediaId: { userId, mediaId } },
      });
    } else {
      await prisma.mediaLike.create({ data: { userId, mediaId } });
      // Check opinion-maker badge for the media owner
      const media = await prisma.reviewMedia.findUnique({
        where: { id: mediaId },
        select: { review: { select: { userId: true } } },
      });
      if (media?.review.userId) {
        await checkAndAwardBadges(media.review.userId);
      }
    }

    const count = await prisma.mediaLike.count({ where: { mediaId } });
    return { success: true, data: { liked: !existing, count } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getMediaLikeCount(mediaId: string): Promise<number> {
  return prisma.mediaLike.count({ where: { mediaId } });
}

export async function hasUserLikedMedia(
  userId: string,
  mediaId: string
): Promise<boolean> {
  const like = await prisma.mediaLike.findFirst({ where: { userId, mediaId } });
  return !!like;
}

export async function getRestaurantMedia(
  restaurantId: string,
  sort: "likes" | "recent" = "likes"
) {
  try {
    const media = await prisma.reviewMedia.findMany({
      where: { review: { restaurantId } },
      include: {
        review: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            vibeTags: { include: { vibeTag: true } },
          },
        },
        _count: { select: { likes: true } },
      },
      orderBy:
        sort === "likes"
          ? { likes: { _count: "desc" } }
          : { createdAt: "desc" },
    });
    return { success: true, data: media };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
