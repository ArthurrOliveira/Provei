"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types";
import { getCurrentUser } from "./auth";
import { Prisma } from "@prisma/client";
import type { Restaurant } from "@prisma/client";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const DETAILS_URL = "https://places.googleapis.com/v1/places";
const FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "regularOpeningHours",
  "nationalPhoneNumber",
  "websiteUri",
  "googleMapsUri",
  "photos",
  "rating",
  "userRatingCount",
].join(",");

// In-memory rate limiter: max 10 Place Details calls per user per minute
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

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

// ── Google Place Details ───────────────────────────────────────────────────────

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  googleMapsUri: string | null;
  googleRating: number | null;
  googleRatingCount: number | null;
  openingHours: object | null;
  photoReferences: string[];
};

export async function getPlaceDetails(
  googlePlaceId: string,
  sessionToken?: string
): Promise<ActionResult<{ existing: string | null; details: PlaceDetails }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Não autenticado" };

  if (!checkRateLimit(user.id)) {
    return { success: false, error: "Limite de consultas atingido (10/min). Aguarde um momento." };
  }

  // Check if restaurant already exists in DB
  const existing = await prisma.restaurant.findUnique({
    where: { googlePlaceId },
    select: { id: true },
  });
  if (existing) {
    return { success: true, data: { existing: existing.id, details: null as unknown as PlaceDetails } };
  }

  if (!API_KEY) {
    return { success: false, error: "Google Places API key não configurada" };
  }

  const url = `${DETAILS_URL}/${googlePlaceId}${sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : ""}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: `Google API error: ${err}` };
  }

  const place = await res.json();

  const details: PlaceDetails = {
    placeId: googlePlaceId,
    name: place.displayName?.text ?? "",
    address: place.formattedAddress ?? "",
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    phone: place.nationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    googleMapsUri: place.googleMapsUri ?? null,
    googleRating: place.rating ?? null,
    googleRatingCount: place.userRatingCount ?? null,
    openingHours: place.regularOpeningHours ?? null,
    photoReferences: (place.photos ?? []).slice(0, 6).map((p: { name: string }) => p.name),
  };

  return { success: true, data: { existing: null, details } };
}

// ── Create restaurant (from Google or manual) ──────────────────────────────────

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

    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        observacao: data.observacao ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
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
