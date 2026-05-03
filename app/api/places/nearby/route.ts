import { NextRequest, NextResponse } from "next/server";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

type OsmElement = {
  type: "node" | "way";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) return NextResponse.json({ places: [] });

  const query = `[out:json][timeout:8];
(
  node["amenity"="restaurant"](around:1500,${lat},${lng});
  way["amenity"="restaurant"](around:1500,${lat},${lng});
);
out center 40;`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mangut/1.0",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    const elements: OsmElement[] = data.elements ?? [];

    const places = elements
      .filter((el) => el.tags?.name)
      .map((el) => {
        const elLat = el.type === "way" ? el.center?.lat : el.lat;
        const elLng = el.type === "way" ? el.center?.lon : el.lon;
        const tags = el.tags ?? {};
        const street = [tags["addr:street"], tags["addr:housenumber"]]
          .filter(Boolean)
          .join(", ");
        return {
          placeId: `${el.type}/${el.id}`,
          name: tags.name,
          address: street || tags["addr:full"] || "",
          lat: elLat,
          lng: elLng,
          rating: null,
        };
      })
      .filter((p) => p.lat && p.lng);

    return NextResponse.json({ places });
  } catch (e) {
    console.error("[nearby] error:", e);
    return NextResponse.json({ places: [] });
  }
}
