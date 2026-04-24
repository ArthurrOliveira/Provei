"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkPlaceExists, createRestaurant } from "@/app/actions/restaurants";
import { toast } from "sonner";

type Suggestion = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
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
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 2) { setSuggestions([]); setOpen(false); return; }
      setLoading(true);
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: q, lat: userLocation?.lat, lng: userLocation?.lng }),
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

  useEffect(() => { fetchSuggestions(query); }, [query, fetchSuggestions, userLocation]);

  async function handleSelect(s: Suggestion) {
    setSelecting(true);
    setOpen(false);
    setQuery(s.name);

    // Checa se já existe no banco pelo placeId
    const check = await checkPlaceExists(s.placeId);
    if (check.success && check.data.existingId) {
      router.push(`/app/restaurants/${check.data.existingId}`);
      return;
    }

    // Cria com lat/lng que já vieram do Geoapify
    const res = await createRestaurant({
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      googlePlaceId: s.placeId,
    });

    if (!res.success) {
      toast.error("Erro ao cadastrar restaurante: " + res.error);
      setSelecting(false);
      return;
    }

    toast.success("Restaurante adicionado!");
    router.push(`/app/restaurants/${res.data.id}`);
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
          placeholder="Buscar restaurante..."
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
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-cream transition-colors",
                "border-b border-cream-dark/50 last:border-0"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-burgundy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-sm text-charcoal truncate">{s.name}</p>
                <p className="font-body text-xs text-sage truncate mt-0.5">{s.address}</p>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 border-t border-cream-dark">
            <p className="text-[10px] text-sage font-body">
              Powered by <span className="font-medium">Geoapify</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
