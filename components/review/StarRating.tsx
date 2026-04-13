"use client";

import { cn } from "@/lib/utils";

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            size === "sm" ? "text-base" : "text-2xl"
          )}
        >
          <span className={star <= value ? "text-orange-500" : "text-gray-200"}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}
