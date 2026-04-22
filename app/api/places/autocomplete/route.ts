import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ suggestions: [] });

  const { input, sessionToken } = await req.json();
  if (!input?.trim()) return NextResponse.json({ suggestions: [] });

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
    },
    body: JSON.stringify({
      input,
      sessionToken,
      includedTypes: ["restaurant", "food"],
      languageCode: "pt-BR",
    }),
  });

  if (!res.ok) return NextResponse.json({ suggestions: [] });

  const data = await res.json();
  return NextResponse.json({ suggestions: data.suggestions ?? [] });
}
