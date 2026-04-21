import { getReviewsByRestaurantFiltered } from "@/app/actions/reviews";
import ReviewCard from "./ReviewCard";

export default async function ReviewListFiltered({
  restaurantId,
  userIds,
  currentUserId,
  emptyMessage,
}: {
  restaurantId: string;
  userIds: string[];
  currentUserId?: string;
  emptyMessage?: string;
}) {
  if (userIds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage ?? "Nenhuma avaliação para exibir."}</p>
      </div>
    );
  }

  const res = await getReviewsByRestaurantFiltered(restaurantId, userIds);
  const reviews = res.success ? res.data : [];

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage ?? "Nenhuma avaliação ainda neste grupo."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
