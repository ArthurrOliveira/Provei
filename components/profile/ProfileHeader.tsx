"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/app/actions/social";
import { toast } from "sonner";

type Profile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  email: string;
  _count: { followers: number; following: number; reviews: number };
};

export default function ProfileHeader({
  profile,
  currentUserId,
  isFollowing: initialFollowing,
}: {
  profile: Profile;
  currentUserId?: string;
  isFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const isOwnProfile = currentUserId === profile.id;

  async function handleToggleFollow() {
    if (!currentUserId) return;
    setLoading(true);
    if (following) {
      await unfollowUser(currentUserId, profile.id);
      setFollowing(false);
      toast.success(`Deixou de seguir ${profile.name}`);
    } else {
      await followUser(currentUserId, profile.id);
      setFollowing(true);
      toast.success(`Seguindo ${profile.name}`);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-orange-100">
      <Avatar className="w-16 h-16">
        <AvatarImage src={profile.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-orange-200 text-orange-700 text-xl">
          {profile.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
        <div className="flex gap-4 mt-2 text-sm text-gray-500">
          <span>
            <strong className="text-gray-900">{profile._count.reviews}</strong> avaliações
          </span>
          <span>
            <strong className="text-gray-900">{profile._count.followers}</strong> seguidores
          </span>
          <span>
            <strong className="text-gray-900">{profile._count.following}</strong> seguindo
          </span>
        </div>
      </div>

      {!isOwnProfile && currentUserId && (
        <Button
          onClick={handleToggleFollow}
          disabled={loading}
          variant={following ? "outline" : "default"}
          className={
            following
              ? "border-orange-300 text-orange-600"
              : "bg-orange-600 hover:bg-orange-700"
          }
          size="sm"
        >
          {following ? "Seguindo" : "Seguir"}
        </Button>
      )}
    </div>
  );
}
