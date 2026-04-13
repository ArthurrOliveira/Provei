import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import FriendsClient from "@/components/friends/FriendsClient";
import { getFollowing } from "@/app/actions/social";

export default async function FriendsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const following = await getFollowing(currentUser.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Amigos</h1>
        <p className="text-sm text-gray-500">Pessoas que você segue</p>
      </div>
      <FriendsClient
        currentUserId={currentUser.id}
        initialFollowing={following.map((f) => f.following)}
      />
    </div>
  );
}
