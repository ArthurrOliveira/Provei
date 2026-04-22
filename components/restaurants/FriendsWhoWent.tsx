"use client";

import { useState } from "react";
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
          className={cn("w-3 h-3", i <= value ? "fill-gold text-gold" : "fill-cream-dark text-cream-dark")}
        />
      ))}
    </div>
  );
}

function AvatarButton({ friend, size = "md", onClick }: { friend: FriendReviewSummary; size?: "md" | "sm"; onClick: () => void }) {
  const dim = size === "md" ? "w-11 h-11" : "w-8 h-8";
  const text = size === "md" ? "text-xs" : "text-[10px]";

  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center gap-1">
      <div className={cn(
        "rounded-full p-0.5 transition-transform group-hover:scale-110",
        friend.isSelf ? "ring-2 ring-gold ring-offset-1" : "ring-1 ring-transparent group-hover:ring-burgundy/30"
      )}>
        <Avatar className={cn(dim, size === "sm" && "opacity-70 group-hover:opacity-100")}>
          <AvatarImage src={friend.avatarUrl ?? undefined} />
          <AvatarFallback className={cn("bg-olive text-cream", text, "font-body")}>
            {friend.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      {size === "md" && (
        <span className={cn("text-[10px] font-body text-sage max-w-[44px] truncate leading-none", friend.isSelf && "text-gold font-medium")}>
          {friend.isSelf ? "Você" : friend.name.split(" ")[0]}
        </span>
      )}
    </button>
  );
}

function ReviewDialog({ friend, open, onClose, restaurantId }: { friend: FriendReviewSummary; open: boolean; onClose: () => void; restaurantId: string }) {
  const hasComment = friend.comment && friend.comment.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Review de {friend.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-full p-0.5", friend.isSelf ? "ring-2 ring-gold ring-offset-1" : "")}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={friend.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-olive text-cream text-xs font-body">
                  {friend.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-body font-semibold text-charcoal text-sm">
                  {friend.isSelf ? "Você" : friend.name}
                  {friend.isSelf && <span className="ml-1.5 text-xs text-sage font-normal">avaliou</span>}
                </p>
                {friend.topBadge && (
                  <span
                    title={friend.topBadge.label}
                    className="inline-flex items-center gap-0.5 text-xs text-burgundy-dark bg-gold/20 px-1.5 py-0.5 rounded-full font-body font-medium"
                  >
                    <span>{BADGE_ICONS[friend.topBadge.slug] ?? "🏅"}</span>
                    <span>{friend.topBadge.label}</span>
                  </span>
                )}
              </div>
              {friend.rating !== null && <StarMini value={friend.rating} />}
            </div>
          </div>

          {friend.vibeTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {friend.vibeTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-olive/10 text-olive-dark font-body">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {hasComment && (
            <p className="font-body text-sm text-charcoal/80 leading-relaxed italic border-l-2 border-burgundy/30 pl-3">
              &ldquo;{friend.comment.length > 120 ? friend.comment.slice(0, 120) + "…" : friend.comment}&rdquo;
            </p>
          )}

          <Link
            href={`/app/profile/${friend.userId}`}
            onClick={onClose}
            className="flex items-center justify-between text-sm font-body text-burgundy hover:text-burgundy-light font-medium pt-1 border-t border-cream-dark"
          >
            Ver perfil completo
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AvatarRow({ friends, size = "md", onSelect }: { friends: FriendReviewSummary[]; size?: "md" | "sm"; onSelect: (f: FriendReviewSummary) => void }) {
  const visible = friends.slice(0, MAX_VISIBLE);
  const overflow = friends.length - MAX_VISIBLE;

  return (
    <div className="flex items-end gap-2 flex-wrap">
      {visible.map((f) => (
        <AvatarButton key={f.userId} friend={f} size={size} onClick={() => onSelect(f)} />
      ))}
      {overflow > 0 && (
        <div className={cn(
          "rounded-full bg-cream text-charcoal font-body font-semibold flex items-center justify-center flex-shrink-0 text-xs border border-cream-dark",
          size === "md" ? "w-11 h-11" : "w-8 h-8"
        )}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

export default function FriendsWhoWent({ data, restaurantId }: { data: FriendsWhoReviewedResult; restaurantId: string }) {
  const [selected, setSelected] = useState<FriendReviewSummary | null>(null);
  const { direct, fof, aggregates, hasFriendsInApp } = data;
  const hasAnyone = direct.length > 0 || fof.length > 0;

  if (!hasFriendsInApp) {
    return (
      <div className="bg-cream rounded-xl p-4 flex items-center justify-between gap-3 border border-cream-dark">
        <div>
          <p className="font-body text-sm font-medium text-charcoal">Siga amigos para ver quem já foi aqui</p>
          <p className="font-body text-xs text-sage mt-0.5">Descubra o que seus amigos acharam deste restaurante</p>
        </div>
        <Link href="/app/friends">
          <Button size="sm" variant="outline" className="border-burgundy/40 text-burgundy hover:bg-burgundy hover:text-cream font-body gap-1.5 flex-shrink-0">
            <UserPlus className="w-3.5 h-3.5" />
            Amigos
          </Button>
        </Link>
      </div>
    );
  }

  if (!hasAnyone) {
    return (
      <div className="bg-cream rounded-xl p-4 flex items-center justify-between gap-3 border border-cream-dark">
        <div>
          <p className="font-body text-sm font-medium text-charcoal">Nenhum amigo avaliou ainda</p>
          <p className="font-body text-xs text-sage mt-0.5">Seja o primeiro a recomendar para seus amigos!</p>
        </div>
        <span className="text-2xl flex-shrink-0">🍽️</span>
      </div>
    );
  }

  return (
    <>
      {direct.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-olive" />
            <p className="font-body text-sm font-semibold text-charcoal">Amigos que foram</p>
          </div>

          <AvatarRow friends={direct} size="md" onSelect={setSelected} />

          <div className="bg-cream rounded-xl px-4 py-3 space-y-1.5 border border-cream-dark">
            <p className="font-body text-sm text-charcoal">
              <span className="font-semibold">{aggregates.count}</span>{" "}
              {aggregates.count === 1 ? "amigo foi" : "amigos foram"}
              {aggregates.avgRating !== null && (
                <>
                  {" · "}
                  <span className="font-semibold">{aggregates.avgRating}</span>
                  <Star className="w-3 h-3 fill-gold text-gold inline mb-0.5 ml-0.5" />
                  {" "}média
                </>
              )}
            </p>
            {aggregates.topVibeTags.length > 0 && (
              <p className="font-body text-xs text-sage">
                <span className="font-medium text-charcoal">Seus amigos dizem:</span>{" "}
                {aggregates.topVibeTags.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {fof.length > 0 && (
        <div className="space-y-2 mt-1">
          <p className="font-body text-xs font-semibold text-sage uppercase tracking-wide">Conhecidos que foram</p>
          <AvatarRow friends={fof} size="sm" onSelect={setSelected} />
        </div>
      )}

      {selected && (
        <ReviewDialog friend={selected} open={!!selected} onClose={() => setSelected(null)} restaurantId={restaurantId} />
      )}
    </>
  );
}
