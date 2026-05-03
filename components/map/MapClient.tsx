"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VibeTag } from "@prisma/client";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

type MapRestaurant = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  reviewCount: number;
  avgRating: number | null;
  topTags: { id: string; label: string; count: number }[];
  googlePlaceId: string | null;
};

export default function MapClient({
  restaurants,
  vibeTags,
  listTitle,
  focusRestaurant,
}: {
  restaurants: MapRestaurant[];
  vibeTags: VibeTag[];
  listTitle?: string;
  focusRestaurant?: { lat: number; lng: number; restaurantId: string | null } | null;
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSheet, setShowSheet] = useState(false);

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  const filtered =
    selectedTags.length === 0
      ? restaurants
      : restaurants.filter((r) => r.topTags.some((t) => selectedTags.includes(t.id)));

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
      {/* List filter banner */}
      {listTitle && (
        <div className="absolute top-3 left-3 right-3 z-30 bg-burgundy text-cream text-xs font-body font-semibold rounded-full px-4 py-1.5 shadow text-center">
          Lista: {listTitle} · {restaurants.length} lugares
        </div>
      )}

      {/* Vibe tag filter bar */}
      <div className={cn(
        "absolute left-3 right-3 z-20 bg-warm-white/95 backdrop-blur-sm rounded-xl p-2 shadow flex gap-1.5 overflow-x-auto",
        listTitle ? "top-12" : "top-3"
      )}>
        {vibeTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={cn(
              "text-xs font-body px-2.5 py-1 rounded-full border whitespace-nowrap transition-all flex-shrink-0",
              selectedTags.includes(tag.id)
                ? "bg-olive text-cream border-olive"
                : "text-charcoal border-cream-dark hover:border-olive-light"
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>

      <MapView restaurants={filtered} focusRestaurant={focusRestaurant} />

      {/* Mobile bottom sheet */}
      <div
        className={cn(
          "md:hidden absolute bottom-0 left-0 right-0 bg-warm-white rounded-t-2xl shadow-2xl z-20 transition-transform duration-300",
          showSheet ? "translate-y-0" : "translate-y-[calc(100%-3.5rem)]"
        )}
      >
        <button
          onClick={() => setShowSheet(!showSheet)}
          className="w-full py-3 flex flex-col items-center gap-1"
        >
          <div className="w-10 h-1 bg-cream-dark rounded-full" />
          <span className="font-body text-xs text-sage">{filtered.length} restaurantes</span>
        </button>
        <div className="overflow-y-auto max-h-64 divide-y divide-cream-dark px-3 pb-4">
          {filtered.map((r) => (
            <div key={r.id} className="py-3">
              <Link href={`/app/restaurants/${r.id}`} className="font-display font-medium text-sm text-charcoal hover:text-burgundy">
                {r.name}
              </Link>
              <p className="font-body text-xs text-sage mt-0.5">{r.address}</p>
              <p className="font-body text-xs text-sage/70">{r.reviewCount} avaliações de amigos</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {r.topTags.map((t) => (
                  <Badge key={t.id} className="text-xs py-0 bg-olive/10 text-olive-dark font-body">
                    {t.label}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
