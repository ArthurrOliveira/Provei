"use client";

import { useState } from "react";
import { getFeed } from "@/app/actions/feed";
import { getAllVibeTags } from "@/app/actions/reviews";
import ReviewCard from "@/components/review/ReviewCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewWithRelations } from "@/types";
import type { VibeTag } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Users, ChevronDown } from "lucide-react";

export default function FeedClient({
  userId,
  vibeTags,
  initialReviews,
  initialNextCursor,
}: {
  userId: string;
  vibeTags: VibeTag[];
  initialReviews: ReviewWithRelations[];
  initialNextCursor: string | null;
}) {
  const [mode, setMode] = useState<"friends" | "fof">("friends");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviews, setReviews] = useState(initialReviews);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function applyFilters(newMode?: "friends" | "fof", newTags?: string[]) {
    const m = newMode ?? mode;
    const tags = newTags ?? selectedTags;
    setLoading(true);
    const res = await getFeed({ userId, mode: m, vibeTagIds: tags });
    setReviews(res.reviews);
    setNextCursor(res.nextCursor);
    setLoading(false);
  }

  async function handleModeChange(m: "friends" | "fof") {
    setMode(m);
    await applyFilters(m);
  }

  async function handleTagToggle(id: string) {
    const newTags = selectedTags.includes(id)
      ? selectedTags.filter((t) => t !== id)
      : [...selectedTags, id];
    setSelectedTags(newTags);
    await applyFilters(undefined, newTags);
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    const res = await getFeed({
      userId,
      mode,
      vibeTagIds: selectedTags,
      cursor: nextCursor,
    });
    setReviews((prev) => [...prev, ...res.reviews]);
    setNextCursor(res.nextCursor);
    setLoadingMore(false);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-orange-100 p-4 space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "friends" ? "default" : "outline"}
            onClick={() => handleModeChange("friends")}
            className={
              mode === "friends"
                ? "bg-orange-600 hover:bg-orange-700"
                : "border-orange-200"
            }
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            Amigos
          </Button>
          <Button
            size="sm"
            variant={mode === "fof" ? "default" : "outline"}
            onClick={() => handleModeChange("fof")}
            className={
              mode === "fof"
                ? "bg-orange-600 hover:bg-orange-700"
                : "border-orange-200"
            }
          >
            Amigos de amigos
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {vibeTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagToggle(tag.id)}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                selectedTags.includes(tag.id)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "text-gray-500 border-gray-200 hover:border-orange-300"
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-500 space-y-3">
          <div className="text-5xl">🍽️</div>
          <p className="font-medium">Seu feed está vazio</p>
          <p className="text-sm">
            Siga amigos para ver as avaliações deles aqui!
          </p>
          <Button
            variant="outline"
            className="border-orange-300 text-orange-600"
            onClick={() => window.location.assign("/app/friends")}
          >
            Encontrar amigos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              showRestaurant
              currentUserId={userId}
            />
          ))}

          {nextCursor && (
            <Button
              variant="outline"
              className="w-full border-orange-200 text-orange-600"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                "Carregando..."
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Carregar mais
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
