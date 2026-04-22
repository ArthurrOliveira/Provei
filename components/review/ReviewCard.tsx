import Link from "next/link";
import Image from "next/image";
import { ReviewWithRelations } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { Zap } from "lucide-react";
import { BADGE_ICONS, getTopBadge } from "@/lib/badges/badge-utils";
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
  const isQuickReview = !review.comment || review.comment.trim() === "";
  const topBadge = getTopBadge(review.user.badges?.map((ub) => ub.badge) ?? []);

  return (
    <Card
      className={
        isQuickReview
          ? "overflow-hidden transition-colors border-gold/20 bg-cream/40"
          : "overflow-hidden hover:border-burgundy/20 transition-colors"
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/app/profile/${review.user.id}`}>
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={review.user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-olive text-cream text-xs font-body">
                {review.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <Link
                  href={`/app/profile/${review.user.id}`}
                  className="font-body font-semibold text-sm text-charcoal hover:text-burgundy"
                >
                  {review.user.name}
                </Link>
                {topBadge && (
                  <span
                    title={topBadge.label}
                    className="inline-flex items-center gap-0.5 text-xs text-burgundy-dark bg-gold/20 px-1.5 py-0.5 rounded-full font-body font-medium"
                  >
                    <span>{BADGE_ICONS[topBadge.slug] ?? "🏅"}</span>
                    <span className="hidden sm:inline">{topBadge.label}</span>
                  </span>
                )}
                {showRestaurant && (
                  <span className="font-body text-sm text-sage">
                    em{" "}
                    <Link
                      href={`/app/restaurants/${review.restaurant.id}`}
                      className="hover:text-burgundy"
                    >
                      {review.restaurant.name}
                    </Link>
                  </span>
                )}
                {isQuickReview && (
                  <span className="inline-flex items-center gap-1 text-xs text-burgundy bg-gold/20 px-1.5 py-0.5 rounded-full font-body font-medium">
                    <Zap className="w-3 h-3" />
                    Rápida
                  </span>
                )}
              </div>
              <span className="text-xs text-sage flex-shrink-0 font-body">
                {formatRelativeTime(review.createdAt)}
              </span>
            </div>

            {review.rating !== null && (
              <StarRating value={review.rating} readonly size="sm" />
            )}

            {!isQuickReview && (
              <p className="font-body text-sm text-charcoal/80 mt-1 leading-relaxed">
                {truncate(review.comment, 200)}
              </p>
            )}

            {review.vibeTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {review.vibeTags.map(({ vibeTag }) => (
                  <Badge
                    key={vibeTag.id}
                    variant="secondary"
                    className={
                      isQuickReview
                        ? "text-xs bg-gold/15 text-burgundy-dark hover:bg-gold/25 py-1 px-2.5 font-body"
                        : "text-xs bg-olive/10 text-olive-dark hover:bg-olive/20 font-body"
                    }
                  >
                    {vibeTag.label}
                  </Badge>
                ))}
              </div>
            )}

            {firstMedia && (
              <div
                className={
                  isQuickReview
                    ? "mt-3 rounded-xl overflow-hidden w-full"
                    : "mt-3 rounded-lg overflow-hidden w-full max-w-xs"
                }
              >
                <Link href={`/app/restaurants/${review.restaurantId}`}>
                  {firstMedia.type === "IMAGE" ? (
                    <Image
                      src={firstMedia.url}
                      alt="Foto da review"
                      width={isQuickReview ? 480 : 320}
                      height={isQuickReview ? 280 : 200}
                      className={
                        isQuickReview
                          ? "w-full h-52 object-cover hover:opacity-90 transition-opacity rounded-xl"
                          : "w-full h-40 object-cover hover:opacity-90 transition-opacity"
                      }
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
