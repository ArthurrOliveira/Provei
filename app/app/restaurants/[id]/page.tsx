import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { getTopVibeTags } from "@/app/actions/reviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ReviewList from "@/components/review/ReviewList";
import MediaGallery from "@/components/media/MediaGallery";
import { MapPin, Star, PenLine } from "lucide-react";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [restaurant, currentUser] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id },
      include: { _count: { select: { reviews: true } } },
    }),
    getCurrentUser(),
  ]);

  if (!restaurant) notFound();

  const topTagsResult = await getTopVibeTags(id);
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
          <Link href={`/app/restaurants/${id}/review`}>
            <Button className="bg-orange-600 hover:bg-orange-700 gap-2 flex-shrink-0">
              <PenLine className="w-4 h-4" />
              Avaliar
            </Button>
          </Link>
        )}
      </div>

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
        <TabsList>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          <TabsTrigger value="media">Mídia</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews" className="mt-4">
          <ReviewList restaurantId={id} currentUserId={currentUser?.id} />
        </TabsContent>
        <TabsContent value="media" className="mt-4">
          <MediaGallery restaurantId={id} currentUserId={currentUser?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
