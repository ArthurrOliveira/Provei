import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GEOAPIFY_API_KEY ?? "";
const BASE_URL = "https://api.geoapify.com/v1/geocode/autocomplete";

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ suggestions: [] });

  const { input, lat, lng } = await req.json();
  if (!input?.trim()) return NextResponse.json({ suggestions: [] });

  const params = new URLSearchParams({
    text: input,
    type: "amenity",
    "filter[category]": "catering.restaurant,catering.cafe,catering.fast_food,catering.food_court",
    lang: "pt",
    limit: "7",
    apiKey: API_KEY,
  });

  // Prioriza resultados próximos ao usuário
  if (lat && lng) {
    params.set("bias", `proximity:${lng},${lat}`);
  }

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return NextResponse.json({ suggestions: [] });

  const data = await res.json();

  // Normaliza para o formato que o PlacesAutocomplete espera
  const suggestions = (data.features ?? []).map((f: GeoapifyFeature) => ({
    placeId: f.properties.place_id,
    name: f.properties.name ?? f.properties.formatted,
    address: f.properties.formatted,
    lat: f.properties.lat,
    lng: f.properties.lon,
  }));

  return NextResponse.json({ suggestions });
}

type GeoapifyFeature = {
  properties: {
    place_id: string;
    name?: string;
    formatted: string;
    lat: number;
    lon: number;
  };
};
