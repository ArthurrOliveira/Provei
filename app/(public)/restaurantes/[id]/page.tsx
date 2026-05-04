import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getPublicRestaurant,
  getRestaurantPublicAggregates,
} from "@/app/actions/public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import GooglePhotosCarousel from "@/components/restaurants/GooglePhotosCarousel";
import RestaurantGoogleInfo from "@/components/restaurants/RestaurantGoogleInfo";
import LoginGate from "@/components/LoginGate";
import { UtensilsCrossed, MapPin, Star } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const restaurant = await getPublicRestaurant(id);
  if (!restaurant) return { title: "Restaurante não encontrado · mangút" };

  const aggregates = await getRestaurantPublicAggregates(id);
  const description =
    aggregates.topVibeTags.length > 0
      ? `${aggregates.totalReviews} avaliações · ${aggregates.topVibeTags.map((t) => t.label).join(", ")} · ${restaurant.address}`
      : `${aggregates.totalReviews} avaliações · ${restaurant.address}`;

  const photoRef = restaurant.photoReferences[0];
  const image = photoRef
    ? `/api/places/photo?reference=${photoRef}&maxwidth=1200`
    : null;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://mangut.app";
  const canonical = `${baseUrl}/restaurantes/${id}`;

  return {
    title: `${restaurant.name} — Avaliações | mangút`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${restaurant.name} — Avaliações | mangút`,
      description,
      url: canonical,
      type: "website",
      ...(image && {
        images: [{ url: `${baseUrl}${image}`, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${restaurant.name} — Avaliações | mangút`,
      description,
      ...(image && { images: [`${baseUrl}${image}`] }),
    },
  };
}

export default async function PublicRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [restaurant, aggregates] = await Promise.all([
    getPublicRestaurant(id),
    getRestaurantPublicAggregates(id),
  ]);
  if (!restaurant) notFound();

  const maxRatingCount = Math.max(
    ...aggregates.ratingDistribution.map((d) => d.count),
    1
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
    },
    ...(restaurant.lat &&
      restaurant.lng && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: restaurant.lat,
          longitude: restaurant.lng,
        },
      }),
    ...(restaurant.googleMapsUri && { url: restaurant.googleMapsUri }),
    ...(aggregates.totalReviews > 0 &&
      aggregates.avgRating != null && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: aggregates.avgRating,
          reviewCount: aggregates.totalReviews,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        {restaurant.photoReferences.length > 0 && (
          <GooglePhotosCarousel photoReferences={restaurant.photoReferences} />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-charcoal leading-tight">
              {restaurant.name}
            </h1>
            <p className="flex items-center gap-1 font-body text-sm text-sage mt-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{restaurant.address}</span>
            </p>
            {restaurant.googleRating != null && (
              <div className="flex items-center gap-1 mt-1.5">
                <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                <span className="font-body text-sm font-semibold text-charcoal">
                  {restaurant.googleRating.toFixed(1)}
                </span>
                {restaurant.googleRatingCount != null && (
                  <span className="font-body text-xs text-sage">
                    ({restaurant.googleRatingCount.toLocaleString("pt-BR")})
                    Google
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <LoginGate
              action="review"
              returnTo={`/restaurantes/${id}`}
              href={`/app/restaurants/${id}/review`}
            >
              <Button className="bg-burgundy text-cream hover:bg-burgundy/90 font-body">
                Avaliar
              </Button>
            </LoginGate>
          </div>
        </div>

        <RestaurantGoogleInfo
          phone={restaurant.phone}
          website={restaurant.website}
          googleMapsUri={restaurant.googleMapsUri}
          googleRating={restaurant.googleRating}
          googleRatingCount={restaurant.googleRatingCount}
          openingHours={
            restaurant.openingHours as Record<string, unknown> | null
          }
        />

        {/* Bloco "Aqui no mangút" */}
        {aggregates.totalReviews > 0 && (
          <div className="bg-cream rounded-2xl p-5 space-y-4 border border-cream-dark">
            <h2 className="font-display text-base font-bold text-charcoal">
              Aqui no mangút
            </h2>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="font-display text-3xl font-bold text-burgundy">
                  {aggregates.totalReviews}
                </p>
                <p className="font-body text-xs text-sage">avaliações</p>
              </div>
              {aggregates.avgRating != null && (
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-gold text-gold" />
                    <p className="font-display text-3xl font-bold text-charcoal">
                      {aggregates.avgRating.toFixed(1)}
                    </p>
                  </div>
                  <p className="font-body text-xs text-sage">média</p>
                </div>
              )}
            </div>

            {aggregates.topVibeTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aggregates.topVibeTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="bg-olive/10 text-olive-dark font-body"
                  >
                    {tag.label} ({tag.count})
                  </Badge>
                ))}
              </div>
            )}

            {/* Mini bar chart */}
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const d = aggregates.ratingDistribution.find(
                  (r) => r.rating === star
                );
                const count = d?.count ?? 0;
                const pct =
                  maxRatingCount > 0
                    ? Math.round((count / maxRatingCount) * 100)
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="font-body text-xs text-sage w-3 text-right">
                      {star}
                    </span>
                    <Star className="w-3 h-3 fill-gold/60 text-gold/60 flex-shrink-0" />
                    <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-burgundy rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-body text-xs text-sage w-4 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator className="bg-cream-dark" />

        {/* CTA primário */}
        <div className="bg-burgundy rounded-2xl p-6 text-center space-y-3 relative overflow-hidden">
          <UtensilsCrossed className="w-8 h-8 text-gold mx-auto" />
          <h2 className="font-display text-cream font-bold text-lg">
            Entre pra ver quem dos seus amigos avaliou
          </h2>
          <p className="font-body text-cream/70 text-sm">
            No mangút você vê avaliações de quem você confia, não de estranhos.
          </p>
          <LoginGate
            action="review"
            returnTo={`/restaurantes/${id}`}
            href={`/app/restaurants/${id}`}
          >
            <Button className="bg-cream text-burgundy hover:bg-cream-dark font-body font-semibold">
              Criar conta grátis
            </Button>
          </LoginGate>
        </div>

        {/* CTA secundário */}
        <div className="flex justify-center pb-4">
          <LoginGate
            action="list"
            returnTo={`/restaurantes/${id}`}
            href={`/app/restaurants/${id}`}
          >
            <Button
              variant="outline"
              className="border-burgundy/40 text-burgundy hover:bg-burgundy hover:text-cream font-body"
            >
              Adicionar à minha lista
            </Button>
          </LoginGate>
        </div>

        {/* Link para versão logada */}
        <p className="text-center font-body text-xs text-sage pb-2">
          Já tem conta?{" "}
          <Link
            href={`/app/restaurants/${id}`}
            className="text-olive hover:underline"
          >
            Ver página completa →
          </Link>
        </p>
      </div>
    </>
  );
}
