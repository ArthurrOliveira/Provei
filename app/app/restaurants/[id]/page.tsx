import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { getTopVibeTags, getAllVibeTags } from "@/app/actions/reviews";
import { getFriendIds, getFriendsWhoReviewed } from "@/app/actions/social";
import { getFriendGroups } from "@/app/actions/groups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ReviewList from "@/components/review/ReviewList";
import ReviewListFiltered from "@/components/review/ReviewListFiltered";
import MediaGallery from "@/components/media/MediaGallery";
import QuickReviewButton from "@/components/review/QuickReviewModal";
import FriendsWhoWent from "@/components/restaurants/FriendsWhoWent";
import RestaurantGoogleInfo from "@/components/restaurants/RestaurantGoogleInfo";
import GooglePhotosCarousel from "@/components/restaurants/GooglePhotosCarousel";
import { MapPin, Star, PenLine, Map } from "lucide-react";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [restaurant, currentUser, allVibeTagsRes] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id },
      include: { _count: { select: { reviews: true } } },
    }),
    getCurrentUser(),
    getAllVibeTags(),
  ]);

  const allVibeTags = allVibeTagsRes.success ? (allVibeTagsRes.data ?? []) : [];
  if (!restaurant) notFound();

  const [topTagsResult, friendIds, groups, friendsData] = await Promise.all([
    getTopVibeTags(id),
    currentUser ? getFriendIds(currentUser.id) : Promise.resolve([]),
    currentUser ? getFriendGroups(currentUser.id) : Promise.resolve([]),
    currentUser ? getFriendsWhoReviewed(id, currentUser.id) : Promise.resolve(null),
  ]);

  const topTags = topTagsResult.success ? topTagsResult.data : [];
  const photoRefs: string[] = Array.isArray(restaurant.photoReferences)
    ? restaurant.photoReferences
    : typeof restaurant.photoReferences === "string"
    ? JSON.parse(restaurant.photoReferences)
    : [];

  return (
    <div className="space-y-6">
      {/* Google Photos carousel */}
      {photoRefs.length > 0 && (
        <GooglePhotosCarousel photoReferences={photoRefs} />
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

          {/* Ver no mapa */}
          {restaurant.lat && restaurant.lng && (
            <Link
              href={`/app/map?lat=${restaurant.lat}&lng=${restaurant.lng}&restaurantId=${id}`}
              className="inline-flex items-center gap-1 font-body text-xs text-olive hover:text-olive-dark mt-1"
            >
              <Map className="w-3.5 h-3.5" />
              Ver no mapa
            </Link>
          )}

          {/* Ratings row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="font-body text-sm text-sage">
              {restaurant._count.reviews} avaliações
            </span>
            {restaurant.googleRating !== null && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                <span className="font-body text-sm font-semibold text-charcoal">
                  {restaurant.googleRating.toFixed(1)}
                </span>
                {restaurant.googleRatingCount !== null && (
                  <span className="font-body text-xs text-sage">
                    ({restaurant.googleRatingCount.toLocaleString("pt-BR")})
                  </span>
                )}
                <span className="font-body text-xs text-sage">Google</span>
              </div>
            )}
          </div>
        </div>

        {currentUser && (
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <Link href={`/app/restaurants/${id}/review`}>
              <Button
                variant="outline"
                className="border-burgundy/40 text-burgundy hover:bg-burgundy hover:text-cream font-body gap-2"
              >
                <PenLine className="w-4 h-4" />
                Avaliar
              </Button>
            </Link>
            <QuickReviewButton
              restaurantId={id}
              userId={currentUser.id}
              vibeTags={allVibeTags}
            />
          </div>
        )}
      </div>

      {/* Google info box */}
      <RestaurantGoogleInfo
        phone={restaurant.phone}
        website={restaurant.website}
        googleMapsUri={restaurant.googleMapsUri}
        googleRating={restaurant.googleRating}
        googleRatingCount={restaurant.googleRatingCount}
        openingHours={restaurant.openingHours as Record<string, unknown> | null}
      />

      {/* Friends who went */}
      {currentUser && friendsData && (
        <FriendsWhoWent data={friendsData} restaurantId={id} />
      )}

      {/* Top vibe tags */}
      {topTags.length > 0 && (
        <div>
          <p className="font-body text-xs font-semibold text-sage uppercase tracking-wide mb-2 flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            Mais citado
          </p>
          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="bg-olive/10 text-olive-dark hover:bg-olive/20 font-body"
              >
                {tag.label} ({tag.count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-cream-dark" />

      {/* Reviews tabs */}
      <Tabs defaultValue="reviews">
        <TabsList className="flex-wrap h-auto gap-1 bg-cream">
          <TabsTrigger value="reviews" className="font-body data-[state=active]:bg-burgundy data-[state=active]:text-cream">Todas</TabsTrigger>
          {currentUser && (
            <TabsTrigger value="friends" className="font-body data-[state=active]:bg-burgundy data-[state=active]:text-cream">Amigos</TabsTrigger>
          )}
          {groups.map((group) => (
            <TabsTrigger
              key={group.id}
              value={`group-${group.id}`}
              className="font-body data-[state=active]:bg-burgundy data-[state=active]:text-cream"
            >
              {group.name}
            </TabsTrigger>
          ))}
          <TabsTrigger value="media" className="font-body data-[state=active]:bg-burgundy data-[state=active]:text-cream">Mídia</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4">
          <ReviewList restaurantId={id} currentUserId={currentUser?.id} />
        </TabsContent>

        {currentUser && (
          <TabsContent value="friends" className="mt-4">
            <ReviewListFiltered
              restaurantId={id}
              userIds={friendIds}
              currentUserId={currentUser.id}
              emptyMessage="Nenhum amigo avaliou este restaurante ainda."
            />
          </TabsContent>
        )}

        {groups.map((group) => (
          <TabsContent key={group.id} value={`group-${group.id}`} className="mt-4">
            <ReviewListFiltered
              restaurantId={id}
              userIds={group.members.map((m) => m.user.id)}
              currentUserId={currentUser?.id}
              emptyMessage={`Ninguém do grupo "${group.name}" avaliou este restaurante ainda.`}
            />
          </TabsContent>
        ))}

        <TabsContent value="media" className="mt-4">
          <MediaGallery restaurantId={id} currentUserId={currentUser?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
