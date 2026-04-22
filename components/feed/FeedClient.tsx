"use client";

import { useState } from "react";
import { getFeed } from "@/app/actions/feed";
import ReviewCard from "@/components/review/ReviewCard";
import { Button } from "@/components/ui/button";
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
    const res = await getFeed({ userId, mode, vibeTagIds: selectedTags, cursor: nextCursor });
    setReviews((prev) => [...prev, ...res.reviews]);
    setNextCursor(res.nextCursor);
    setLoadingMore(false);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-cream rounded-xl border border-cream-dark p-4 space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "friends" ? "default" : "outline"}
            onClick={() => handleModeChange("friends")}
            className={cn(
              "font-body",
              mode === "friends"
                ? "bg-burgundy hover:bg-burgundy-light text-cream"
                : "border-cream-dark text-charcoal hover:bg-cream"
            )}
          >
            <Users className="w-3.5 h-3.5 mr-1" />
            Amigos
          </Button>
          <Button
            size="sm"
            variant={mode === "fof" ? "default" : "outline"}
            onClick={() => handleModeChange("fof")}
            className={cn(
              "font-body",
              mode === "fof"
                ? "bg-burgundy hover:bg-burgundy-light text-cream"
                : "border-cream-dark text-charcoal hover:bg-cream"
            )}
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
                "text-xs font-body px-2.5 py-1 rounded-full border transition-all",
                selectedTags.includes(tag.id)
                  ? "bg-olive text-cream border-olive"
                  : "text-charcoal border-cream-dark bg-warm-white hover:border-olive-light"
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
            <div key={i} className="h-40 rounded-xl bg-cream-dark animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-sage space-y-3 font-body">
          <div className="text-5xl">🍽️</div>
          <p className="font-semibold text-charcoal">Seu feed está vazio</p>
          <p className="text-sm">Siga amigos para ver as avaliações deles aqui!</p>
          <Button
            variant="outline"
            className="border-burgundy/40 text-burgundy hover:bg-burgundy hover:text-cream font-body"
            onClick={() => window.location.assign("/app/friends")}
          >
            Encontrar amigos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} showRestaurant currentUserId={userId} />
          ))}

          {nextCursor && (
            <Button
              variant="outline"
              className="w-full border-cream-dark text-charcoal hover:bg-cream font-body"
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
