import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { getFriendIds } from "@/app/actions/social";
import { getAllVibeTags } from "@/app/actions/reviews";
import { prisma } from "@/lib/prisma";
import MapClient from "@/components/map/MapClient";

type RawReview = { rating: number | null; vibeTags: { vibeTag: { id: string; label: string } }[] };

function buildMapRestaurant(
  r: { id: string; name: string; address: string; lat: number | null; lng: number | null; reviews: RawReview[] }
) {
  const vibeTagCounts: Record<string, { label: string; count: number }> = {};
  for (const review of r.reviews) {
    for (const { vibeTag } of review.vibeTags) {
      if (!vibeTagCounts[vibeTag.id]) vibeTagCounts[vibeTag.id] = { label: vibeTag.label, count: 0 };
      vibeTagCounts[vibeTag.id].count++;
    }
  }
  const topTags = Object.entries(vibeTagCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([id, { label, count }]) => ({ id, label, count }));

  const ratingsWithValue = r.reviews.map((rv) => rv.rating).filter((v): v is number => v != null);
  const avgRating = ratingsWithValue.length > 0
    ? Math.round((ratingsWithValue.reduce((a, b) => a + b, 0) / ratingsWithValue.length) * 10) / 10
    : null;

  return {
    id: r.id,
    name: r.name,
    address: r.address,
    lat: r.lat!,
    lng: r.lng!,
    reviewCount: r.reviews.length,
    avgRating,
    topTags,
  };
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ listId?: string; lat?: string; lng?: string; restaurantId?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { listId, lat, lng, restaurantId } = await searchParams;

  const focusRestaurant = lat && lng
    ? { lat: parseFloat(lat), lng: parseFloat(lng), restaurantId: restaurantId ?? null }
    : null;

  const [friendIds, vibeTagsRes] = await Promise.all([
    getFriendIds(currentUser.id),
    getAllVibeTags(),
  ]);

  const vibeTags = (vibeTagsRes.success ? vibeTagsRes.data : []) ?? [];

  let listTitle: string | undefined;

  // If filtering by list, fetch only restaurants from that list (with coords)
  if (listId) {
    const list = await prisma.restaurantList.findUnique({
      where: { id: listId },
      select: { title: true, isPublic: true, userId: true },
    });

    if (list && (list.isPublic || list.userId === currentUser.id)) {
      listTitle = list.title;

      const listItems = await prisma.restaurantListItem.findMany({
        where: {
          listId,
          restaurant: { lat: { not: null }, lng: { not: null } },
        },
        include: {
          restaurant: {
            include: {
              reviews: {
                where:
                  friendIds.length > 0
                    ? { userId: { in: friendIds } }
                    : { userId: currentUser.id },
                include: { vibeTags: { include: { vibeTag: true } } },
              },
            },
          },
        },
        orderBy: { position: "asc" },
      });

      const mapRestaurants = listItems
        .filter((item) => item.restaurant.lat && item.restaurant.lng)
        .map((item) => buildMapRestaurant(item.restaurant));

      return (
        <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
          <MapClient
            restaurants={mapRestaurants}
            vibeTags={vibeTags}
            listTitle={listTitle}
            focusRestaurant={focusRestaurant}
          />
        </div>
      );
    }
  }

  // Default: all restaurants with coordinates
  const restaurants = await prisma.restaurant.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    include: {
      reviews: {
        where:
          friendIds.length > 0
            ? { userId: { in: friendIds } }
            : { userId: currentUser.id },
        include: { vibeTags: { include: { vibeTag: true } } },
      },
    },
  });

  const mapRestaurants = restaurants.map(buildMapRestaurant);

  return (
    <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
      <MapClient restaurants={mapRestaurants} vibeTags={vibeTags} focusRestaurant={focusRestaurant} />
    </div>
  );
}
