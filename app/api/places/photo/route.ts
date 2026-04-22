import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name"); // e.g. "places/xxx/photos/yyy"
  const maxWidth = searchParams.get("maxWidth") ?? "800";

  if (!API_KEY || !name) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const url = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidth}&key=${API_KEY}&skipHttpRedirect=true`;
  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await res.json();
  // Returns { photoUri: "https://..." }
  return NextResponse.json({ photoUri: data.photoUri ?? null });
}
