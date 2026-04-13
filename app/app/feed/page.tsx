import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { getAllVibeTags } from "@/app/actions/reviews";
import { getFeed } from "@/app/actions/feed";
import FeedClient from "@/components/feed/FeedClient";

export default async function FeedPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [vibeTagsRes, initialFeed] = await Promise.all([
    getAllVibeTags(),
    getFeed({ userId: currentUser.id, mode: "friends", limit: 10 }),
  ]);

  const vibeTags = (vibeTagsRes.success ? vibeTagsRes.data : []) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Feed</h1>
        <p className="text-sm text-gray-500">
          O que seus amigos estão comendo
        </p>
      </div>
      <FeedClient
        userId={currentUser.id}
        vibeTags={vibeTags}
        initialReviews={initialFeed.reviews}
        initialNextCursor={initialFeed.nextCursor}
      />
    </div>
  );
}
