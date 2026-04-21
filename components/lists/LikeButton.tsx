"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleListLike } from "@/app/actions/lists";
import { toast } from "sonner";

export default function LikeButton({
  listId,
  initialLiked,
  initialCount,
}: {
  listId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    const prev = liked;
    setLiked(!prev);
    setCount((c) => c + (prev ? -1 : 1));
    const res = await toggleListLike(listId);
    if (!res.success) {
      setLiked(prev);
      setCount((c) => c + (prev ? 1 : -1));
      toast.error("Erro ao curtir");
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all",
        liked
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500"
      )}
    >
      <Heart className={cn("w-4 h-4", liked && "fill-red-500")} />
      {count}
    </button>
  );
}
