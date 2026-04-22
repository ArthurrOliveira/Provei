"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GooglePhotosCarousel({
  photoReferences,
}: {
  photoReferences: string[];
}) {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!photoReferences.length) { setLoading(false); return; }

    Promise.all(
      photoReferences.map((name) =>
        fetch(`/api/places/photo?name=${encodeURIComponent(name)}&maxWidth=800`)
          .then((r) => r.json())
          .then((d) => d.photoUri as string | null)
          .catch(() => null)
      )
    ).then((resolved) => {
      setUrls(resolved.filter(Boolean) as string[]);
      setLoading(false);
    });
  }, [photoReferences]);

  const valid = urls.filter((u): u is string => Boolean(u));
  if (loading) {
    return (
      <div className="w-full h-56 rounded-2xl bg-cream animate-pulse" />
    );
  }
  if (!valid.length) return null;

  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden group">
      <Image
        src={valid[current]}
        alt="Foto do restaurante"
        fill
        className="object-cover transition-opacity duration-300"
        sizes="(max-width: 768px) 100vw, 672px"
        unoptimized
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 to-transparent" />

      {/* Counter */}
      <span className="absolute bottom-3 right-3 font-body text-xs text-cream bg-charcoal/50 px-2 py-0.5 rounded-full">
        {current + 1}/{valid.length}
      </span>

      {/* Navigation */}
      {valid.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + valid.length) % valid.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-charcoal/50 text-cream flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-charcoal/70"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % valid.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-charcoal/50 text-cream flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-charcoal/70"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {valid.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === current ? "bg-cream w-3" : "bg-cream/50"
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Google attribution */}
      <span className="absolute top-2 right-2 font-body text-[10px] text-cream/70 bg-charcoal/40 px-1.5 py-0.5 rounded">
        Google Photos
      </span>
    </div>
  );
}
