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
    <div className="flex items-start gap-4 p-5 bg-burgundy rounded-2xl">
      <Avatar className="w-16 h-16">
        <AvatarImage src={profile.avatarUrl ?? undefined} />
        <AvatarFallback className="bg-olive text-cream text-xl font-body">
          {profile.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h1 className="font-display text-xl font-bold text-cream">{profile.name}</h1>
        <div className="flex gap-4 mt-2 text-sm font-body text-cream/70">
          <span>
            <strong className="text-cream">{profile._count.reviews}</strong> avaliações
          </span>
          <span>
            <strong className="text-cream">{profile._count.followers}</strong> seguidores
          </span>
          <span>
            <strong className="text-cream">{profile._count.following}</strong> seguindo
          </span>
        </div>
      </div>

      {!isOwnProfile && currentUserId && (
        <Button
          onClick={handleToggleFollow}
          disabled={loading}
          size="sm"
          className={
            following
              ? "border-cream/40 text-cream bg-transparent hover:bg-cream/10 border font-body"
              : "bg-cream text-burgundy hover:bg-cream-dark font-body font-semibold"
          }
        >
          {following ? "Seguindo" : "Seguir"}
        </Button>
      )}
    </div>
  );
}
