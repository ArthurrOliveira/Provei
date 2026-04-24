"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types";
import { Prisma } from "@prisma/client";
import type { Restaurant } from "@prisma/client";


// ── Local DB search ────────────────────────────────────────────────────────────

export async function searchRestaurants(
  query: string
): Promise<ActionResult<Restaurant[]>> {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      orderBy: { name: "asc" },
      take: 20,
    });
    return { success: true, data: restaurants };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getRestaurantById(
  id: string
): Promise<ActionResult<Restaurant | null>> {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
    return { success: true, data: restaurant };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Geoapify: checa duplicata antes de criar ───────────────────────────────────

export async function checkPlaceExists(
  geoapifyPlaceId: string
): Promise<ActionResult<{ existingId: string | null }>> {
  try {
    const existing = await prisma.restaurant.findFirst({
      where: { googlePlaceId: geoapifyPlaceId },
      select: { id: true },
    });
    return { success: true, data: { existingId: existing?.id ?? null } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ── Geocode address via Geoapify ───────────────────────────────────────────────

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&limit=1&apiKey=${key}`
    );
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    return { lat: feature.properties.lat, lng: feature.properties.lon };
  } catch {
    return null;
  }
}

// ── Create restaurant (from Geoapify autocomplete or manual) ───────────────────

export async function createRestaurant(data: {
  name: string;
  address: string;
  observacao?: string;
  lat?: number;
  lng?: number;
  googlePlaceId?: string;
  phone?: string;
  website?: string;
  googleMapsUri?: string;
  googleRating?: number;
  googleRatingCount?: number;
  openingHours?: object;
  photoReferences?: string[];
}): Promise<ActionResult<Restaurant>> {
  try {
    // Guard: if googlePlaceId already exists, return existing
    if (data.googlePlaceId) {
      const existing = await prisma.restaurant.findUnique({
        where: { googlePlaceId: data.googlePlaceId },
      });
      if (existing) return { success: true, data: existing };
    }

    // Geocodifica pelo endereço se lat/lng não foram fornecidos
    let lat = data.lat ?? null;
    let lng = data.lng ?? null;
    if ((lat == null || lng == null) && data.address) {
      const coords = await geocodeAddress(data.address);
      if (coords) { lat = coords.lat; lng = coords.lng; }
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        observacao: data.observacao ?? null,
        lat,
        lng,
        googlePlaceId: data.googlePlaceId ?? null,
        phone: data.phone ?? null,
        website: data.website ?? null,
        googleMapsUri: data.googleMapsUri ?? null,
        googleRating: data.googleRating ?? null,
        googleRatingCount: data.googleRatingCount ?? null,
        openingHours: data.openingHours
          ? (data.openingHours as Prisma.InputJsonValue)
          : undefined,
        photoReferences: data.photoReferences
          ? (data.photoReferences as Prisma.InputJsonValue)
          : undefined,
      },
    });
    return { success: true, data: restaurant };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
