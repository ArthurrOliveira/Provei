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
import { MapPin, Star, PenLine } from "lucide-react";

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
    currentUser
      ? getFriendsWhoReviewed(id, currentUser.id)
      : Promise.resolve(null),
  ]);

  const topTags = topTagsResult.success ? topTagsResult.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="w-4 h-4" />
            {restaurant.address}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">
            {restaurant._count.reviews} avaliações
          </p>
        </div>
        {currentUser && (
          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <Link href={`/app/restaurants/${id}/review`}>
              <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 gap-2">
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

      {currentUser && friendsData && (
        <FriendsWhoWent data={friendsData} restaurantId={id} />
      )}

      {topTags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            Mais citado
          </p>
          <div className="flex flex-wrap gap-2">
            {topTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="bg-orange-100 text-orange-700 hover:bg-orange-200"
              >
                {tag.label} ({tag.count})
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <Tabs defaultValue="reviews">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="reviews">Todas</TabsTrigger>
          {currentUser && <TabsTrigger value="friends">Amigos</TabsTrigger>}
          {groups.map((group) => (
            <TabsTrigger key={group.id} value={`group-${group.id}`}>
              {group.name}
            </TabsTrigger>
          ))}
          <TabsTrigger value="media">Mídia</TabsTrigger>
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
