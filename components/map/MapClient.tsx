"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  topTags: { id: string; label: string; count: number }[];
};

export default function MapClient({
  restaurants,
  vibeTags,
}: {
  restaurants: MapRestaurant[];
  vibeTags: VibeTag[];
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
      : restaurants.filter((r) =>
          r.topTags.some((t) => selectedTags.includes(t.id))
        );

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)]">
      {/* Vibe tag filter bar */}
      <div className="absolute top-3 left-3 right-3 z-20 bg-white/90 backdrop-blur-sm rounded-xl p-2 shadow flex gap-1.5 overflow-x-auto">
        {vibeTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border whitespace-nowrap transition-all flex-shrink-0",
              selectedTags.includes(tag.id)
                ? "bg-orange-500 text-white border-orange-500"
                : "text-gray-500 border-gray-200 hover:border-orange-300"
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>

      <MapView restaurants={filtered} />

      {/* Mobile bottom sheet */}
      <div
        className={cn(
          "md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-20 transition-transform duration-300",
          showSheet ? "translate-y-0" : "translate-y-[calc(100%-3.5rem)]"
        )}
      >
        <button
          onClick={() => setShowSheet(!showSheet)}
          className="w-full py-3 flex flex-col items-center gap-1"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
          <span className="text-xs text-gray-500">
            {filtered.length} restaurantes
          </span>
        </button>
        <div className="overflow-y-auto max-h-64 divide-y px-3 pb-4">
          {filtered.map((r) => (
            <div key={r.id} className="py-3">
              <Link
                href={`/app/restaurants/${r.id}`}
                className="font-medium text-sm hover:text-orange-600"
              >
                {r.name}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">{r.address}</p>
              <p className="text-xs text-gray-400">
                {r.reviewCount} avaliações de amigos
              </p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {r.topTags.map((t) => (
                  <Badge
                    key={t.id}
                    className="text-xs py-0 bg-orange-100 text-orange-700"
                  >
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
