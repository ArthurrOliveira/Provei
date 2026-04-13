import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { getFriendIds } from "@/app/actions/social";
import { getAllVibeTags } from "@/app/actions/reviews";
import { prisma } from "@/lib/prisma";
import MapClient from "@/components/map/MapClient";

export default async function MapPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [friendIds, vibeTagsRes] = await Promise.all([
    getFriendIds(currentUser.id),
    getAllVibeTags(),
  ]);

  const vibeTags = (vibeTagsRes.success ? vibeTagsRes.data : []) ?? [];

  // Restaurants with friend reviews that have coordinates
  const restaurants = await prisma.restaurant.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
      reviews: { some: { userId: { in: friendIds } } },
    },
    include: {
      reviews: {
        where: { userId: { in: friendIds } },
        include: {
          vibeTags: { include: { vibeTag: true } },
        },
      },
    },
  });

  const mapRestaurants = restaurants.map((r) => {
    const vibeTagCounts: Record<string, { label: string; count: number }> = {};
    for (const review of r.reviews) {
      for (const { vibeTag } of review.vibeTags) {
        if (!vibeTagCounts[vibeTag.id]) {
          vibeTagCounts[vibeTag.id] = { label: vibeTag.label, count: 0 };
        }
        vibeTagCounts[vibeTag.id].count++;
      }
    }
    const topTags = Object.entries(vibeTagCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([id, { label, count }]) => ({ id, label, count }));

    return {
      id: r.id,
      name: r.name,
      address: r.address,
      lat: r.lat!,
      lng: r.lng!,
      reviewCount: r.reviews.length,
      topTags,
    };
  });

  return (
    <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
      <MapClient
        restaurants={mapRestaurants}
        vibeTags={vibeTags}
      />
    </div>
  );
}
