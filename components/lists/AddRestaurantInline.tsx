"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchRestaurants, createRestaurant } from "@/app/actions/restaurants";
import { addRestaurantToList } from "@/app/actions/lists";
import { toast } from "sonner";

type Result = { id: string; name: string; address: string; isNew?: boolean };

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

export default function AddRestaurantInline({ listId }: { listId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [geoapifyResults, setGeoapifyResults] = useState<Array<{
    placeId: string; name: string; address: string; lat: number; lng: number;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  // Busca local no DB
  const searchDB = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 2) { setResults([]); return; }
      setLoading(true);
      const res = await searchRestaurants(q);
      if (res.success) setResults(res.data.map((r) => ({ id: r.id, name: r.name, address: r.address })));
      setLoading(false);
    }, 300),
    []
  );

  // Busca no Geoapify
  const searchGeoapify = useCallback(
    debounce(async (q: string) => {
      if (!q.trim() || q.length < 2) { setGeoapifyResults([]); return; }
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: q, lat: userLocation?.lat, lng: userLocation?.lng }),
        });
        const data = await res.json();
        setGeoapifyResults(data.suggestions ?? []);
      } catch {
        setGeoapifyResults([]);
      }
    }, 400),
    []
  );

  useEffect(() => {
    searchDB(query);
    searchGeoapify(query);
  }, [query, searchDB, searchGeoapify, userLocation]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function handleSelectExisting(restaurantId: string) {
    setAdding(true);
    const res = await addRestaurantToList(listId, restaurantId);
    setAdding(false);
    if (res.success) {
      toast.success("Restaurante adicionado!");
      setQuery("");
      setResults([]);
      setGeoapifyResults([]);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  async function handleSelectGeoapify(s: typeof geoapifyResults[number]) {
    setAdding(true);
    // Cria o restaurante (createRestaurant já checa duplicata por placeId)
    const createRes = await createRestaurant({
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      googlePlaceId: s.placeId,
    });
    if (!createRes.success) {
      toast.error("Erro ao cadastrar restaurante");
      setAdding(false);
      return;
    }
    const res = await addRestaurantToList(listId, createRes.data.id);
    setAdding(false);
    if (res.success) {
      toast.success("Restaurante adicionado!");
      setQuery("");
      setResults([]);
      setGeoapifyResults([]);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  const showDropdown = query.length >= 2 && (results.length > 0 || geoapifyResults.length > 0);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-cream-dark text-sage font-body text-sm hover:border-olive hover:text-olive transition-colors"
      >
        <Plus className="w-4 h-4" />
        Adicionar restaurante
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-cream-dark bg-warm-white p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {loading || adding ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-burgundy animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
          )}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar restaurante..."
            disabled={adding}
            className="pl-9 pr-4 border-cream-dark focus:border-olive font-body placeholder:text-sage"
          />
        </div>
        <button
          onClick={() => { setOpen(false); setQuery(""); setResults([]); setGeoapifyResults([]); }}
          className="p-2 text-sage hover:text-charcoal rounded-lg hover:bg-cream transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showDropdown && (
        <div className="border border-cream-dark rounded-lg overflow-hidden divide-y divide-cream-dark/50">
          {/* Resultados locais */}
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              disabled={adding}
              onClick={() => handleSelectExisting(r.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-cream transition-colors",
                adding && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="w-7 h-7 rounded-md bg-cream flex items-center justify-center flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 text-burgundy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-sm text-charcoal truncate">{r.name}</p>
                <p className="font-body text-xs text-sage truncate">{r.address}</p>
              </div>
            </button>
          ))}

          {/* Resultados do Geoapify — apenas os que não batem com resultado local */}
          {geoapifyResults
            .filter((g) => !results.some((r) => r.name.toLowerCase() === g.name.toLowerCase()))
            .slice(0, 4)
            .map((g) => (
              <button
                key={g.placeId}
                type="button"
                disabled={adding}
                onClick={() => handleSelectGeoapify(g)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-cream transition-colors",
                  adding && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="w-7 h-7 rounded-md bg-olive/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 text-olive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-charcoal truncate">{g.name}</p>
                  <p className="font-body text-xs text-sage truncate">{g.address}</p>
                </div>
                <span className="font-body text-[10px] text-sage flex-shrink-0 bg-cream px-1.5 py-0.5 rounded-full">novo</span>
              </button>
            ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && geoapifyResults.length === 0 && (
        <p className="font-body text-xs text-sage text-center py-2">Nenhum resultado encontrado</p>
      )}
    </div>
  );
}
