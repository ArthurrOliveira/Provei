import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://mangut.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/restaurantes/", "/lists/", "/explore/"],
        disallow: ["/app/", "/api/", "/auth/", "/invite/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
