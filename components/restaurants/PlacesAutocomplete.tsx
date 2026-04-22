"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlaceDetails, createRestaurant } from "@/app/actions/restaurants";
import { toast } from "sonner";

type Suggestion = {
  placePrediction: {
    placeId: string;
    text: { text: string };
    structuredFormat: {
      mainText: { text: string };
      secondaryText?: { text: string };
    };
  };
};

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function PlacesAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [open, setOpen] = useState(false);
  const sessionTokenRef = useRef(crypto.randomUUID());
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 2) { setSuggestions([]); setOpen(false); return; }
      setLoading(true);
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: q, sessionToken: sessionTokenRef.current }),
        });
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen((data.suggestions ?? []).length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => { fetchSuggestions(query); }, [query, fetchSuggestions]);

  async function handleSelect(suggestion: Suggestion) {
    const pred = suggestion.placePrediction;
    setSelecting(true);
    setOpen(false);
    setQuery(pred.structuredFormat.mainText.text);

    const sessionToken = sessionTokenRef.current;
    // Rotate session token after use
    sessionTokenRef.current = crypto.randomUUID();

    const res = await getPlaceDetails(pred.placeId, sessionToken);

    if (!res.success) {
      toast.error(res.error);
      setSelecting(false);
      return;
    }

    // Restaurant already exists → redirect
    if (res.data.existing) {
      router.push(`/app/restaurants/${res.data.existing}`);
      return;
    }

    const d = res.data.details;
    const createRes = await createRestaurant({
      name: d.name,
      address: d.address,
      lat: d.lat ?? undefined,
      lng: d.lng ?? undefined,
      googlePlaceId: d.placeId,
      phone: d.phone ?? undefined,
      website: d.website ?? undefined,
      googleMapsUri: d.googleMapsUri ?? undefined,
      googleRating: d.googleRating ?? undefined,
      googleRatingCount: d.googleRatingCount ?? undefined,
      openingHours: d.openingHours ?? undefined,
      photoReferences: d.photoReferences,
    });

    if (!createRes.success) {
      toast.error("Erro ao cadastrar restaurante: " + createRes.error);
      setSelecting(false);
      return;
    }

    toast.success("Restaurante adicionado!");
    router.push(`/app/restaurants/${createRes.data.id}`);
  }

  function clearInput() {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <div className="relative">
        {selecting ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-burgundy animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
        )}
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar restaurante no Google Places..."
          disabled={selecting}
          className="pl-9 pr-9 border-cream-dark focus:border-olive focus:ring-olive/20 bg-warm-white font-body placeholder:text-sage"
        />
        {query && !selecting && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sage hover:text-charcoal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-warm-white border border-cream-dark rounded-xl shadow-lg overflow-hidden">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-sage font-body border-b border-cream-dark">
              <Loader2 className="w-3 h-3 animate-spin" />
              Buscando...
            </div>
          )}
          {suggestions.map((s) => {
            const pred = s.placePrediction;
            return (
              <button
                key={pred.placeId}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-cream transition-colors border-b border-cream-dark/50 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-burgundy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-charcoal truncate">
                    {pred.structuredFormat.mainText.text}
                  </p>
                  {pred.structuredFormat.secondaryText && (
                    <p className="font-body text-xs text-sage truncate mt-0.5">
                      {pred.structuredFormat.secondaryText.text}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
          <div className="px-4 py-2 border-t border-cream-dark">
            <p className="text-[10px] text-sage font-body flex items-center gap-1">
              <span>Powered by</span>
              <span className="font-medium">Google Places</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
