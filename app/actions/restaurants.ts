"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types";
import type { Restaurant } from "@prisma/client";

export async function searchRestaurants(
  query: string
): Promise<ActionResult<Restaurant[]>> {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
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

export async function createRestaurant(data: {
  name: string;
  address: string;
  observacao?: string;
  lat?: number;
  lng?: number;
}): Promise<ActionResult<Restaurant>> {
  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        observacao: data.observacao ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
      },
    });
    return { success: true, data: restaurant };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
