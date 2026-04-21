"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ActionResult, ListSummary, ListDetail } from "@/types";
import { getCurrentUser } from "./auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THUMBNAIL_INCLUDE = {
  take: 3,
  orderBy: { position: "asc" as const },
  include: {
    restaurant: {
      include: {
        reviews: {
          take: 1,
          orderBy: { createdAt: "desc" as const },
          include: {
            media: { take: 1, where: { type: "IMAGE" as const } },
          },
        },
      },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSummary(list: any, currentUserId?: string): ListSummary {
  const thumbnails: string[] = [];
  for (const item of list.items ?? []) {
    const url = item.restaurant?.reviews?.[0]?.media?.[0]?.url;
    if (url) thumbnails.push(url);
  }
  return {
    id: list.id,
    userId: list.userId,
    title: list.title,
    description: list.description,
    coverImageUrl: list.coverImageUrl,
    isPublic: list.isPublic,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    user: list.user,
    _count: { items: list._count?.items ?? 0, likes: list._count?.likes ?? 0 },
    thumbnails,
    isLiked: currentUserId
      ? (list.likes ?? []).some((l: { userId: string }) => l.userId === currentUserId)
      : false,
  };
}

// ---------------------------------------------------------------------------
// Read actions
// ---------------------------------------------------------------------------

export async function getListsFromFriends(
  userId: string
): Promise<ActionResult<ListSummary[]>> {
  try {
    const lists = await prisma.restaurantList.findMany({
      where: {
        isPublic: true,
        user: { followers: { some: { followerId: userId } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { items: true, likes: true } },
        likes: { where: { userId }, select: { userId: true } },
        items: THUMBNAIL_INCLUDE,
      },
    });
    return { success: true, data: lists.map((l) => toSummary(l, userId)) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getListsByUser(
  targetUserId: string,
  currentUserId?: string,
  includePrivate = false
): Promise<ActionResult<ListSummary[]>> {
  try {
    const lists = await prisma.restaurantList.findMany({
      where: {
        userId: targetUserId,
        ...(includePrivate ? {} : { isPublic: true }),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { items: true, likes: true } },
        ...(currentUserId
          ? { likes: { where: { userId: currentUserId }, select: { userId: true } } }
          : {}),
        items: THUMBNAIL_INCLUDE,
      },
    });
    return { success: true, data: lists.map((l) => toSummary(l, currentUserId)) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getListById(
  listId: string,
  currentUserId?: string
): Promise<ActionResult<ListDetail | null>> {
  try {
    const list = await prisma.restaurantList.findUnique({
      where: { id: listId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { likes: true } },
        ...(currentUserId
          ? { likes: { where: { userId: currentUserId }, select: { userId: true } } }
          : {}),
        items: {
          orderBy: { position: "asc" },
          include: {
            restaurant: {
              include: {
                reviews: {
                  take: 1,
                  orderBy: { createdAt: "desc" },
                  include: { media: { take: 1, where: { type: "IMAGE" } } },
                },
              },
            },
          },
        },
      },
    });

    if (!list) return { success: true, data: null };

    const restaurantIds = list.items.map((i) => i.restaurantId);

    const reviewVibeTags =
      restaurantIds.length > 0
        ? await prisma.reviewVibeTag.findMany({
            where: { review: { restaurantId: { in: restaurantIds } } },
            include: {
              vibeTag: { select: { label: true } },
              review: { select: { restaurantId: true } },
            },
          })
        : [];

    const tagCountsByRestaurant: Record<string, Record<string, number>> = {};
    for (const rvt of reviewVibeTags) {
      const rid = rvt.review.restaurantId;
      if (!tagCountsByRestaurant[rid]) tagCountsByRestaurant[rid] = {};
      const label = rvt.vibeTag.label;
      tagCountsByRestaurant[rid][label] = (tagCountsByRestaurant[rid][label] ?? 0) + 1;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isLiked = currentUserId
      ? ((list as any).likes ?? []).some(
          (l: { userId: string }) => l.userId === currentUserId
        )
      : false;

    const detail: ListDetail = {
      id: list.id,
      userId: list.userId,
      title: list.title,
      description: list.description,
      coverImageUrl: list.coverImageUrl,
      isPublic: list.isPublic,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
      user: list.user,
      _count: { likes: list._count.likes },
      isLiked,
      items: list.items.map((item) => {
        const tagCounts = tagCountsByRestaurant[item.restaurantId] ?? {};
        const topVibeTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([label, count]) => ({ label, count }));
        return {
          restaurantId: item.restaurantId,
          note: item.note,
          position: item.position,
          restaurant: {
            id: item.restaurant.id,
            name: item.restaurant.name,
            address: item.restaurant.address,
            topVibeTags,
            thumbnailUrl: item.restaurant.reviews[0]?.media[0]?.url ?? null,
          },
        };
      }),
    };

    return { success: true, data: detail };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ---------------------------------------------------------------------------
// Write actions
// ---------------------------------------------------------------------------

export async function createList(data: {
  title: string;
  description?: string;
  isPublic: boolean;
  items: { restaurantId: string; note?: string }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const list = await prisma.restaurantList.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description ?? null,
        isPublic: data.isPublic,
        items: {
          create: data.items.map((item, i) => ({
            restaurantId: item.restaurantId,
            note: item.note ?? null,
            position: i,
          })),
        },
      },
    });

    revalidatePath("/app/lists");
    revalidatePath(`/app/profile/${user.id}`);
    return { success: true, data: { id: list.id } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function updateList(
  listId: string,
  data: {
    title: string;
    description?: string;
    isPublic: boolean;
    items: { restaurantId: string; note?: string; position: number }[];
  }
): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const list = await prisma.restaurantList.findUnique({ where: { id: listId } });
    if (!list || list.userId !== user.id) return { success: false, error: "Sem permissão" };

    await prisma.$transaction([
      prisma.restaurantList.update({
        where: { id: listId },
        data: {
          title: data.title,
          description: data.description ?? null,
          isPublic: data.isPublic,
          updatedAt: new Date(),
        },
      }),
      prisma.restaurantListItem.deleteMany({ where: { listId } }),
      prisma.restaurantListItem.createMany({
        data: data.items.map((item) => ({
          listId,
          restaurantId: item.restaurantId,
          note: item.note ?? null,
          position: item.position,
        })),
      }),
    ]);

    revalidatePath("/app/lists");
    revalidatePath(`/app/lists/${listId}`);
    revalidatePath(`/lists/${listId}`);
    revalidatePath(`/app/profile/${user.id}`);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteList(listId: string): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const list = await prisma.restaurantList.findUnique({ where: { id: listId } });
    if (!list || list.userId !== user.id) return { success: false, error: "Sem permissão" };

    await prisma.restaurantList.delete({ where: { id: listId } });

    revalidatePath("/app/lists");
    revalidatePath(`/app/profile/${user.id}`);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function toggleListLike(
  listId: string
): Promise<ActionResult<{ liked: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Não autenticado" };

    const existing = await prisma.listLike.findUnique({
      where: { userId_listId: { userId: user.id, listId } },
    });

    if (existing) {
      await prisma.listLike.delete({
        where: { userId_listId: { userId: user.id, listId } },
      });
      revalidatePath(`/app/lists/${listId}`);
      return { success: true, data: { liked: false } };
    } else {
      await prisma.listLike.create({ data: { userId: user.id, listId } });
      revalidatePath(`/app/lists/${listId}`);
      return { success: true, data: { liked: true } };
    }
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
