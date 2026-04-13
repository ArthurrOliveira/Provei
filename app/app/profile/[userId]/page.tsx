import { notFound } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import {
  getUserProfile,
  isFollowing,
  getFollowing,
} from "@/app/actions/social";
import { getReviewsByRestaurant } from "@/app/actions/reviews";
import { prisma } from "@/lib/prisma";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ReviewCard from "@/components/review/ReviewCard";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  let { userId } = await params;
  const currentUser = await getCurrentUser();

  if (userId === "me") {
    if (!currentUser) return notFound();
    userId = currentUser.id;
  }

  const [profileRes] = await Promise.all([getUserProfile(userId)]);

  if (!profileRes.success || !profileRes.data) notFound();
  const profile = profileRes.data;

  let following = false;
  if (currentUser && currentUser.id !== userId) {
    following = await isFollowing(currentUser.id, userId);
  }

  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      restaurant: { select: { id: true, name: true, address: true } },
      vibeTags: { include: { vibeTag: true } },
      media: { take: 1, include: { _count: { select: { likes: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <ProfileHeader
        profile={profile}
        currentUserId={currentUser?.id}
        isFollowing={following}
      />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Avaliações
        </h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhuma avaliação ainda.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                review={review as any}
                showRestaurant
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
