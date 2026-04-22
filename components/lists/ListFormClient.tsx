"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { searchRestaurants } from "@/app/actions/restaurants";
import { createList, updateList } from "@/app/actions/lists";
import { Search, X, ChevronUp, ChevronDown, MapPin, Plus, Globe, Lock } from "lucide-react";
import type { Restaurant } from "@prisma/client";

type FormItem = { restaurantId: string; name: string; address: string; note: string };
type InitialData = { id?: string; title: string; description: string; isPublic: boolean; items: FormItem[] };

export default function ListFormClient({ initialData }: { initialData?: InitialData }) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
  const [items, setItems] = useState<FormItem[]>(initialData?.items ?? []);
  const [submitting, setSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setShowResults(false); return; }
    setSearching(true);
    setShowResults(true);
    const res = await searchRestaurants(q);
    if (res.success) setSearchResults(res.data);
    setSearching(false);
  }, []);

  function addRestaurant(r: Restaurant) {
    if (items.some((i) => i.restaurantId === r.id)) { toast.error("Restaurante já está na lista"); return; }
    setItems((prev) => [...prev, { restaurantId: r.id, name: r.name, address: r.address, note: "" }]);
    setSearchQuery(""); setSearchResults([]); setShowResults(false);
  }

  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }
  function moveUp(idx: number) {
    if (idx === 0) return;
    setItems((prev) => { const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next; });
  }
  function moveDown(idx: number) {
    setItems((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next;
    });
  }
  function updateNote(idx: number, note: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, note } : item)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Informe um título para a lista"); return; }
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      isPublic,
      items: items.map((item, i) => ({ restaurantId: item.restaurantId, note: item.note.trim() || undefined, position: i })),
    };
    try {
      if (isEditing && initialData?.id) {
        const res = await updateList(initialData.id, payload);
        if (!res.success) throw new Error(res.error);
        toast.success("Lista atualizada!");
        router.push(`/app/lists/${initialData.id}`);
      } else {
        const res = await createList(payload);
        if (!res.success) throw new Error(res.error);
        toast.success("Lista criada! 🎉");
        router.push(`/app/lists/${res.data.id}`);
      }
    } catch (err) {
      toast.error("Erro: " + String(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title" className="mb-2 block font-body font-semibold text-charcoal">Título *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Melhores botecos de SP"
          required
          maxLength={80}
          className="border-cream-dark focus:border-olive focus:ring-olive/20 bg-warm-white font-body placeholder:text-sage"
        />
      </div>

      <div>
        <Label htmlFor="desc" className="mb-2 block font-body font-semibold text-charcoal">Descrição (opcional)</Label>
        <Textarea
          id="desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Conta um pouco sobre essa lista..."
          className="resize-none border-cream-dark focus:border-olive focus:ring-olive/20 bg-warm-white font-body placeholder:text-sage"
          maxLength={300}
        />
      </div>

      <div>
        <Label className="mb-2 block font-body font-semibold text-charcoal">Visibilidade</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-body font-medium transition-all",
              isPublic ? "bg-olive text-cream border-olive" : "bg-cream text-charcoal border-cream-dark hover:border-olive-light"
            )}
          >
            <Globe className="w-4 h-4" />
            Pública
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-body font-medium transition-all",
              !isPublic ? "bg-charcoal text-cream border-charcoal" : "bg-cream text-charcoal border-cream-dark hover:border-charcoal/40"
            )}
          >
            <Lock className="w-4 h-4" />
            Privada
          </button>
        </div>
        <p className="font-body text-xs text-sage mt-1.5">
          {isPublic ? "Qualquer pessoa com o link pode ver esta lista" : "Somente você pode ver esta lista"}
        </p>
      </div>

      <div>
        <Label className="mb-2 block font-body font-semibold text-charcoal">Restaurantes</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
          <Input
            placeholder="Buscar restaurante para adicionar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="pl-9 border-cream-dark focus:border-olive focus:ring-olive/20 bg-warm-white font-body placeholder:text-sage"
          />
          {showResults && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-warm-white border border-cream-dark rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searching ? (
                <p className="font-body text-sm text-sage text-center py-4">Buscando...</p>
              ) : searchResults.length === 0 ? (
                <p className="font-body text-sm text-sage text-center py-4">Nenhum resultado</p>
              ) : (
                searchResults.map((r) => {
                  const alreadyAdded = items.some((i) => i.restaurantId === r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => addRestaurant(r)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-cream transition-colors",
                        alreadyAdded && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <MapPin className="w-4 h-4 text-burgundy flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-charcoal truncate">{r.name}</p>
                        <p className="font-body text-xs text-sage truncate">{r.address}</p>
                      </div>
                      {alreadyAdded ? (
                        <span className="font-body text-xs text-sage">Adicionado</span>
                      ) : (
                        <Plus className="w-4 h-4 text-burgundy flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        {showResults && (
          <button type="button" onClick={() => setShowResults(false)} className="font-body text-xs text-sage mt-1 hover:text-charcoal">
            Fechar resultados
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <p className="font-body text-sm font-medium text-charcoal">
            {items.length} {items.length === 1 ? "restaurante" : "restaurantes"} na lista
          </p>
          {items.map((item, idx) => (
            <div key={item.restaurantId} className="bg-cream rounded-xl p-3 space-y-2 border border-cream-dark">
              <div className="flex items-start gap-2">
                <span className="font-body text-xs font-bold text-sage mt-0.5 w-5 flex-shrink-0">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-charcoal leading-tight">{item.name}</p>
                  <p className="font-body text-xs text-sage truncate">{item.address}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1 rounded hover:bg-cream-dark disabled:opacity-30 transition-colors">
                    <ChevronUp className="w-3.5 h-3.5 text-charcoal" />
                  </button>
                  <button type="button" onClick={() => moveDown(idx)} disabled={idx === items.length - 1} className="p-1 rounded hover:bg-cream-dark disabled:opacity-30 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5 text-charcoal" />
                  </button>
                  <button type="button" onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-burgundy/10 text-sage hover:text-burgundy transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <Input
                placeholder='Nota pessoal (ex: "pede o risoto")'
                value={item.note}
                onChange={(e) => updateNote(idx, e.target.value)}
                className="h-8 text-xs bg-warm-white border-cream-dark font-body placeholder:text-sage"
                maxLength={120}
              />
            </div>
          ))}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-burgundy hover:bg-burgundy-light text-cream font-body font-semibold"
      >
        {submitting ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar alterações" : "Criar lista")}
      </Button>
    </form>
  );
}
