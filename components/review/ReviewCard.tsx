import Link from "next/link";
import Image from "next/image";
import { ReviewWithRelations } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime, truncate } from "@/lib/utils";
import StarRating from "./StarRating";

export default function ReviewCard({
  review,
  showRestaurant = false,
  currentUserId,
}: {
  review: ReviewWithRelations;
  showRestaurant?: boolean;
  currentUserId?: string;
}) {
  const firstMedia = review.media?.[0];

  return (
    <Card className="overflow-hidden hover:border-orange-200 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/app/profile/${review.user.id}`}>
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={review.user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-orange-200 text-orange-700 text-xs">
                {review.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Link
                  href={`/app/profile/${review.user.id}`}
                  className="font-medium text-sm text-gray-900 hover:text-orange-600"
                >
                  {review.user.name}
                </Link>
                {showRestaurant && (
                  <span className="text-sm text-gray-500">
                    {" "}
                    em{" "}
                    <Link
                      href={`/app/restaurants/${review.restaurant.id}`}
                      className="hover:text-orange-600"
                    >
                      {review.restaurant.name}
                    </Link>
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {formatRelativeTime(review.createdAt)}
              </span>
            </div>

            {review.rating !== null && (
              <StarRating value={review.rating} readonly size="sm" />
            )}

            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              {truncate(review.comment, 200)}
            </p>

            {review.vibeTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {review.vibeTags.map(({ vibeTag }) => (
                  <Badge
                    key={vibeTag.id}
                    variant="secondary"
                    className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200"
                  >
                    {vibeTag.label}
                  </Badge>
                ))}
              </div>
            )}

            {firstMedia && (
              <div className="mt-3 rounded-lg overflow-hidden w-full max-w-xs">
                <Link href={`/app/restaurants/${review.restaurantId}`}>
                  {firstMedia.type === "IMAGE" ? (
                    <Image
                      src={firstMedia.url}
                      alt="Foto da review"
                      width={320}
                      height={200}
                      className="w-full h-40 object-cover hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="relative">
                      <Image
                        src={firstMedia.thumbnailUrl ?? firstMedia.url}
                        alt="Thumbnail do vídeo"
                        width={320}
                        height={200}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                          <span className="text-white text-lg">▶</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
