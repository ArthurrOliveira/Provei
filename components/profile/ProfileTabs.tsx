"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import ReviewCard from "@/components/review/ReviewCard";
import ListCard from "@/components/lists/ListCard";
import { BookMarked, Star, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ReviewWithRelations, ListSummary } from "@/types";

export default function ProfileTabs({
  reviews,
  lists,
  isOwnProfile,
  userId,
  currentUserId,
}: {
  reviews: ReviewWithRelations[];
  lists: ListSummary[];
  isOwnProfile: boolean;
  userId: string;
  currentUserId?: string;
}) {
  const [tab, setTab] = useState<"reviews" | "lists">("reviews");

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100">
        <button
          type="button"
          onClick={() => setTab("reviews")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
            tab === "reviews"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <Star className="w-4 h-4" />
          Avaliações
          {reviews.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {reviews.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("lists")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
            tab === "lists"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <BookMarked className="w-4 h-4" />
          Listas
          {lists.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {lists.length}
            </span>
          )}
        </button>
      </div>

      {/* Reviews tab */}
      {tab === "reviews" && (
        <>
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">Nenhuma avaliação ainda.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showRestaurant
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Lists tab */}
      {tab === "lists" && (
        <>
          {lists.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <BookMarked className="w-10 h-10 text-gray-300 mx-auto" />
              {isOwnProfile ? (
                <>
                  <p className="text-gray-500 text-sm">Você ainda não tem listas.</p>
                  <Link href="/app/lists/new">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700 gap-2">
                      <Plus className="w-4 h-4" />
                      Criar lista
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma lista pública ainda.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
              {isOwnProfile && (
                <Link href="/app/lists/new">
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl h-full min-h-[200px] flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors cursor-pointer">
                    <Plus className="w-8 h-8" />
                    <span className="text-sm font-medium">Nova lista</span>
                  </div>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
