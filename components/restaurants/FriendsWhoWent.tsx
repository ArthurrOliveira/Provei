"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FriendReviewSummary, FriendsWhoReviewedResult } from "@/types";
import { BADGE_ICONS } from "@/lib/badges/badge-utils";
import { Star, Users, ChevronRight, UserPlus } from "lucide-react";

const MAX_VISIBLE = 8;

function StarMini({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3",
            i <= value ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

function AvatarButton({
  friend,
  size = "md",
  onClick,
}: {
  friend: FriendReviewSummary;
  size?: "md" | "sm";
  onClick: () => void;
}) {
  const dim = size === "md" ? "w-11 h-11" : "w-8 h-8";
  const text = size === "md" ? "text-xs" : "text-[10px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1"
    >
      <div
        className={cn(
          "rounded-full p-0.5 transition-transform group-hover:scale-110",
          friend.isSelf
            ? "ring-2 ring-amber-400 ring-offset-1"
            : "ring-1 ring-transparent group-hover:ring-orange-300"
        )}
      >
        <Avatar className={cn(dim, size === "sm" && "opacity-70 group-hover:opacity-100")}>
          <AvatarImage src={friend.avatarUrl ?? undefined} />
          <AvatarFallback
            className={cn(
              "bg-orange-200 text-orange-700",
              text
            )}
          >
            {friend.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      {size === "md" && (
        <span
          className={cn(
            "text-[10px] text-gray-500 max-w-[44px] truncate leading-none",
            friend.isSelf && "text-amber-600 font-medium"
          )}
        >
          {friend.isSelf ? "Você" : friend.name.split(" ")[0]}
        </span>
      )}
    </button>
  );
}

function ReviewDialog({
  friend,
  open,
  onClose,
  restaurantId,
}: {
  friend: FriendReviewSummary;
  open: boolean;
  onClose: () => void;
  restaurantId: string;
}) {
  const hasComment = friend.comment && friend.comment.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Review de {friend.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* User header */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-full p-0.5",
                friend.isSelf ? "ring-2 ring-amber-400 ring-offset-1" : ""
              )}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={friend.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-orange-200 text-orange-700 text-xs">
                  {friend.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-gray-900 text-sm">
                  {friend.isSelf ? "Você" : friend.name}
                  {friend.isSelf && (
                    <span className="ml-1.5 text-xs text-amber-600 font-normal">
                      avaliou
                    </span>
                  )}
                </p>
                {friend.topBadge && (
                  <span
                    title={friend.topBadge.label}
                    className="inline-flex items-center gap-0.5 text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full font-medium"
                  >
                    <span>{BADGE_ICONS[friend.topBadge.slug] ?? "🏅"}</span>
                    <span>{friend.topBadge.label}</span>
                  </span>
                )}
              </div>
              {friend.rating !== null && <StarMini value={friend.rating} />}
            </div>
          </div>

          {/* Vibe tags */}
          {friend.vibeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {friend.vibeTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs bg-amber-100 text-amber-700"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Comment excerpt */}
          {hasComment && (
            <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-orange-200 pl-3">
              &ldquo;
              {friend.comment.length > 120
                ? friend.comment.slice(0, 120) + "…"
                : friend.comment}
              &rdquo;
            </p>
          )}

          {/* CTA */}
          <Link
            href={`/app/profile/${friend.userId}`}
            onClick={onClose}
            className="flex items-center justify-between text-sm text-orange-600 hover:text-orange-700 font-medium pt-1 border-t border-gray-100"
          >
            Ver perfil completo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AvatarRow({
  friends,
  size = "md",
  onSelect,
}: {
  friends: FriendReviewSummary[];
  size?: "md" | "sm";
  onSelect: (f: FriendReviewSummary) => void;
}) {
  const visible = friends.slice(0, MAX_VISIBLE);
  const overflow = friends.length - MAX_VISIBLE;

  return (
    <div className="flex items-end gap-2 flex-wrap">
      {visible.map((f) => (
        <AvatarButton key={f.userId} friend={f} size={size} onClick={() => onSelect(f)} />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "rounded-full bg-orange-100 text-orange-600 font-semibold flex items-center justify-center flex-shrink-0 text-xs",
            size === "md" ? "w-11 h-11" : "w-8 h-8"
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export default function FriendsWhoWent({
  data,
  restaurantId,
}: {
  data: FriendsWhoReviewedResult;
  restaurantId: string;
}) {
  const [selected, setSelected] = useState<FriendReviewSummary | null>(null);
  const { direct, fof, aggregates, hasFriendsInApp } = data;

  const hasAnyone = direct.length > 0 || fof.length > 0;

  // Empty state: user has no friends in the app
  if (!hasFriendsInApp) {
    return (
      <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Siga amigos para ver quem já foi aqui
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Descubra o que seus amigos acharam deste restaurante
          </p>
        </div>
        <Link href="/app/friends">
          <Button size="sm" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 gap-1.5 flex-shrink-0">
            <UserPlus className="w-3.5 h-3.5" />
            Amigos
          </Button>
        </Link>
      </div>
    );
  }

  // Logged in with friends but no one reviewed
  if (!hasAnyone) {
    return (
      <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Nenhum amigo avaliou ainda
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Seja o primeiro a recomendar para seus amigos!
          </p>
        </div>
        <span className="text-2xl flex-shrink-0">🍽️</span>
      </div>
    );
  }

  return (
    <>
      {/* Direct friends */}
      {direct.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-semibold text-gray-800">
              Amigos que foram
            </p>
          </div>

          <AvatarRow friends={direct} size="md" onSelect={setSelected} />

          {/* Aggregated summary */}
          <div className="bg-orange-50 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{aggregates.count}</span>{" "}
              {aggregates.count === 1 ? "amigo foi" : "amigos foram"}
              {aggregates.avgRating !== null && (
                <>
                  {" · "}
                  <span className="font-semibold">{aggregates.avgRating}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline mb-0.5 ml-0.5" />
                  {" "}média
                </>
              )}
            </p>
            {aggregates.topVibeTags.length > 0 && (
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-600">Seus amigos dizem:</span>{" "}
                {aggregates.topVibeTags.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Friends of friends */}
      {fof.length > 0 && (
        <div className="space-y-2 mt-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Conhecidos que foram
          </p>
          <AvatarRow friends={fof} size="sm" onSelect={setSelected} />
        </div>
      )}

      {/* Review detail dialog */}
      {selected && (
        <ReviewDialog
          friend={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          restaurantId={restaurantId}
        />
      )}
    </>
  );
}
