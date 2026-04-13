"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleMediaLike } from "@/app/actions/media";
import { toast } from "sonner";
import { Heart, X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaItemFull = {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  thumbnailUrl: string | null;
  review: {
    user: { id: string; name: string; avatarUrl: string | null };
    vibeTags: { vibeTag: { id: string; label: string } }[];
  };
  _count: { likes: number };
};

export default function MediaGalleryClient({
  media,
  currentUserId,
}: {
  media: MediaItemFull[];
  currentUserId?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(media.map((m) => [m.id, m._count.likes]))
  );
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<"likes" | "recent">("likes");

  const sorted =
    sort === "likes"
      ? [...media].sort(
          (a, b) => (likeCounts[b.id] ?? 0) - (likeCounts[a.id] ?? 0)
        )
      : [...media];

  async function handleLike(mediaId: string) {
    if (!currentUserId) return;
    const wasLiked = likedIds.has(mediaId);
    // Optimistic
    setLikedIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(mediaId) : next.add(mediaId);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [mediaId]: (prev[mediaId] ?? 0) + (wasLiked ? -1 : 1),
    }));

    const res = await toggleMediaLike(currentUserId, mediaId);
    if (res.success) {
      setLikeCounts((prev) => ({ ...prev, [mediaId]: res.data.count }));
    } else {
      // Revert
      setLikedIds((prev) => {
        const next = new Set(prev);
        wasLiked ? next.add(mediaId) : next.delete(mediaId);
        return next;
      });
    }
  }

  function navigate(dir: number) {
    if (selectedIndex === null) return;
    const next = (selectedIndex + dir + sorted.length) % sorted.length;
    setSelectedIndex(next);
  }

  const selected = selectedIndex !== null ? sorted[selectedIndex] : null;

  return (
    <>
      <div className="flex justify-end mb-3 gap-2">
        <Button
          size="sm"
          variant={sort === "likes" ? "default" : "outline"}
          onClick={() => setSort("likes")}
          className={sort === "likes" ? "bg-orange-600 hover:bg-orange-700" : ""}
        >
          Mais curtidos
        </Button>
        <Button
          size="sm"
          variant={sort === "recent" ? "default" : "outline"}
          onClick={() => setSort("recent")}
          className={sort === "recent" ? "bg-orange-600 hover:bg-orange-700" : ""}
        >
          Mais recentes
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {sorted.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(idx)}
            className="aspect-square rounded-lg overflow-hidden relative group"
          >
            <Image
              src={item.thumbnailUrl ?? item.url}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            {item.type === "VIDEO" && (
              <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-xs text-white drop-shadow">
              <Heart className="w-3 h-3" />
              {likeCounts[item.id] ?? 0}
            </div>
          </button>
        ))}
      </div>

      {/* Fullscreen modal */}
      {selected && selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-4">
            <Link
              href={`/app/profile/${selected.review.user.id}`}
              className="flex items-center gap-2"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={selected.review.user.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-orange-200 text-orange-700 text-xs">
                  {selected.review.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-medium">
                {selected.review.user.name}
              </span>
            </Link>
            <button
              onClick={() => setSelectedIndex(null)}
              className="text-white hover:text-orange-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center px-12">
            <button
              onClick={() => navigate(-1)}
              className="absolute left-2 text-white hover:text-orange-400 z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {selected.type === "IMAGE" ? (
              <div className="relative w-full h-full max-w-2xl">
                <Image
                  src={selected.url}
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <video
                src={selected.url}
                controls
                className="max-w-full max-h-full rounded-lg"
              />
            )}

            <button
              onClick={() => navigate(1)}
              className="absolute right-2 text-white hover:text-orange-400 z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          <div className="p-4 space-y-2">
            {selected.review.vibeTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.review.vibeTags.map(({ vibeTag }) => (
                  <Badge
                    key={vibeTag.id}
                    className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30"
                  >
                    {vibeTag.label}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLike(selected.id)}
                disabled={!currentUserId}
                className={cn(
                  "flex items-center gap-1.5 text-sm transition-colors",
                  likedIds.has(selected.id)
                    ? "text-red-400"
                    : "text-white hover:text-red-400"
                )}
              >
                <Heart
                  className={cn(
                    "w-5 h-5",
                    likedIds.has(selected.id) ? "fill-red-400" : ""
                  )}
                />
                {likeCounts[selected.id] ?? 0}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
