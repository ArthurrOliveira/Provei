import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://mangut.app";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [restaurants, lists] = await Promise.all([
    prisma.restaurant.findMany({
      where: { reviews: { some: { includeInPublicAggregates: true } } },
      select: { id: true, createdAt: true },
    }),
    prisma.restaurantList.findMany({
      where: { isPublic: true },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const restaurantEntries: MetadataRoute.Sitemap = restaurants.map((r) => ({
    url: `${BASE_URL}/restaurantes/${r.id}`,
    lastModified: r.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const listEntries: MetadataRoute.Sitemap = lists.map((l) => ({
    url: `${BASE_URL}/lists/${l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/explore/map`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/explore/feed`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...restaurantEntries,
    ...listEntries,
  ];
}
