import { notFound } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { getUserProfile, isFollowing } from "@/app/actions/social";
import { getProfileBadges } from "@/app/actions/badges";
import { getListsByUser } from "@/app/actions/lists";
import { prisma } from "@/lib/prisma";
import ProfileHeader from "@/components/profile/ProfileHeader";
import BadgesSection from "@/components/profile/BadgesSection";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { ReviewWithRelations } from "@/types";

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

  const isOwnProfile = currentUser?.id === userId;

  const [profileRes, badgesData, listsRes] = await Promise.all([
    getUserProfile(userId),
    getProfileBadges(userId),
    getListsByUser(userId, currentUser?.id, isOwnProfile),
  ]);

  if (!profileRes.success || !profileRes.data) notFound();
  const profile = profileRes.data;

  let following = false;
  if (currentUser && currentUser.id !== userId) {
    following = await isFollowing(currentUser.id, userId);
  }

  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          badges: {
            include: { badge: { select: { slug: true, label: true } } },
          },
        },
      },
      restaurant: { select: { id: true, name: true, address: true } },
      vibeTags: { include: { vibeTag: true } },
      media: { take: 1, include: { _count: { select: { likes: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const lists = listsRes.success ? (listsRes.data ?? []) : [];

  return (
    <div className="space-y-6">
      <ProfileHeader
        profile={profile}
        currentUserId={currentUser?.id}
        isFollowing={following}
      />

      <BadgesSection badges={badgesData} />

      <ProfileTabs
        reviews={reviews as ReviewWithRelations[]}
        lists={lists}
        isOwnProfile={isOwnProfile}
        userId={userId}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
