import { getReviewsByRestaurant } from "@/app/actions/reviews";
import ReviewCard from "./ReviewCard";

export default async function ReviewList({
  restaurantId,
  currentUserId,
}: {
  restaurantId: string;
  currentUserId?: string;
}) {
  const res = await getReviewsByRestaurant(restaurantId);
  const reviews = res.success ? res.data : [];

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma avaliação ainda. Seja o primeiro!</p>
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
