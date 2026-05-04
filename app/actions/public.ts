// PUBLIC ACTION — never include user-identifying fields
"use server";

import { prisma } from "@/lib/prisma";

export type RestaurantPublicAggregates = {
  totalReviews: number;
  avgRating: number | null;
  ratingDistribution: { rating: number; count: number }[];
  topVibeTags: { id: string; label: string; count: number }[];
};

export async function getRestaurantPublicAggregates(
  restaurantId: string
): Promise<RestaurantPublicAggregates> {
  const reviews = await prisma.review.findMany({
    where: { restaurantId, includeInPublicAggregates: true },
    select: {
      rating: true,
      vibeTags: { select: { vibeTag: { select: { id: true, label: true } } } },
    },
  });

  const totalReviews = reviews.length;
  const ratingsWithValue = reviews
    .map((r) => r.rating)
    .filter((v): v is number => v != null);
  const avgRating =
    ratingsWithValue.length > 0
      ? Math.round(
          (ratingsWithValue.reduce((a, b) => a + b, 0) /
            ratingsWithValue.length) *
            10
        ) / 10
      : null;

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratingsWithValue) {
    if (r >= 1 && r <= 5) ratingCounts[r]++;
  }
  const ratingDistribution = [1, 2, 3, 4, 5].map((r) => ({
    rating: r,
    count: ratingCounts[r],
  }));

  const vibeTagCounts: Record<string, { label: string; count: number }> = {};
  for (const review of reviews) {
    for (const { vibeTag } of review.vibeTags) {
      if (!vibeTagCounts[vibeTag.id]) {
        vibeTagCounts[vibeTag.id] = { label: vibeTag.label, count: 0 };
      }
      vibeTagCounts[vibeTag.id].count++;
    }
  }
  const topVibeTags = Object.entries(vibeTagCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([id, { label, count }]) => ({ id, label, count }));

  return { totalReviews, avgRating, ratingDistribution, topVibeTags };
}

export type PublicRestaurant = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  googleMapsUri: string | null;
  googleRating: number | null;
  googleRatingCount: number | null;
  openingHours: unknown;
  photoReferences: string[];
};

export async function getPublicRestaurant(
  id: string
): Promise<PublicRestaurant | null> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      address: true,
      lat: true,
      lng: true,
      phone: true,
      website: true,
      googleMapsUri: true,
      googleRating: true,
      googleRatingCount: true,
      openingHours: true,
      photoReferences: true,
    },
  });
  if (!restaurant) return null;
  const photoRefs: string[] = Array.isArray(restaurant.photoReferences)
    ? (restaurant.photoReferences as string[])
    : typeof restaurant.photoReferences === "string"
    ? JSON.parse(restaurant.photoReferences as string)
    : [];
  return { ...restaurant, photoReferences: photoRefs };
}

export type PublicFeedItem = {
  restaurantId: string;
  restaurantName: string;
  vibeTags: string[];
  rating: number | null;
  createdAt: Date;
};

export async function getPublicFeedItems(
  limit = 20
): Promise<PublicFeedItem[]> {
  const reviews = await prisma.review.findMany({
    where: { includeInPublicAggregates: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      rating: true,
      createdAt: true,
      restaurant: { select: { id: true, name: true } },
      vibeTags: { select: { vibeTag: { select: { label: true } } } },
    },
  });
  return reviews.map((r) => ({
    restaurantId: r.restaurant.id,
    restaurantName: r.restaurant.name,
    vibeTags: r.vibeTags.map((vt) => vt.vibeTag.label),
    rating: r.rating,
    createdAt: r.createdAt,
  }));
}

export type PublicMapRestaurant = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  reviewCount: number;
};

export async function getPublicMapRestaurants(): Promise<PublicMapRestaurant[]> {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
      reviews: { some: { includeInPublicAggregates: true } },
    },
    select: {
      id: true,
      name: true,
      address: true,
      lat: true,
      lng: true,
      _count: {
        select: { reviews: { where: { includeInPublicAggregates: true } } },
      },
    },
  });
  return restaurants
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      lat: r.lat!,
      lng: r.lng!,
      reviewCount: r._count.reviews,
    }));
}
