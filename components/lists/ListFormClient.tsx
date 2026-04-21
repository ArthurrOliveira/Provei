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
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  MapPin,
  Plus,
  Globe,
  Lock,
} from "lucide-react";
import type { Restaurant } from "@prisma/client";

type FormItem = {
  restaurantId: string;
  name: string;
  address: string;
  note: string;
};

type InitialData = {
  id?: string;
  title: string;
  description: string;
  isPublic: boolean;
  items: FormItem[];
};

export default function ListFormClient({
  initialData,
}: {
  initialData?: InitialData;
}) {
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
    if (!q.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    setShowResults(true);
    const res = await searchRestaurants(q);
    if (res.success) setSearchResults(res.data);
    setSearching(false);
  }, []);

  function addRestaurant(r: Restaurant) {
    if (items.some((i) => i.restaurantId === r.id)) {
      toast.error("Restaurante já está na lista");
      return;
    }
    setItems((prev) => [
      ...prev,
      { restaurantId: r.id, name: r.name, address: r.address, note: "" },
    ]);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(idx: number) {
    setItems((prev) => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  function updateNote(idx: number, note: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, note } : item))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe um título para a lista");
      return;
    }
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      isPublic,
      items: items.map((item, i) => ({
        restaurantId: item.restaurantId,
        note: item.note.trim() || undefined,
        position: i,
      })),
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
      {/* Title */}
      <div>
        <Label htmlFor="title" className="mb-2 block">
          Título *
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Melhores botecos de SP"
          required
          maxLength={80}
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="desc" className="mb-2 block">
          Descrição (opcional)
        </Label>
        <Textarea
          id="desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Conta um pouco sobre essa lista..."
          className="resize-none"
          maxLength={300}
        />
      </div>

      {/* Visibility toggle */}
      <div>
        <Label className="mb-2 block">Visibilidade</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
              isPublic
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
            )}
          >
            <Globe className="w-4 h-4" />
            Pública
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
              !isPublic
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            <Lock className="w-4 h-4" />
            Privada
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {isPublic
            ? "Qualquer pessoa com o link pode ver esta lista"
            : "Somente você pode ver esta lista"}
        </p>
      </div>

      {/* Restaurant search */}
      <div>
        <Label className="mb-2 block">Restaurantes</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar restaurante para adicionar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="pl-9"
          />
          {showResults && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searching ? (
                <p className="text-sm text-gray-400 text-center py-4">Buscando...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhum resultado
                </p>
              ) : (
                searchResults.map((r) => {
                  const alreadyAdded = items.some(
                    (i) => i.restaurantId === r.id
                  );
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => addRestaurant(r)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors",
                        alreadyAdded && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {r.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{r.address}</p>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs text-gray-400">Adicionado</span>
                      ) : (
                        <Plus className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
        {showResults && (
          <button
            type="button"
            onClick={() => setShowResults(false)}
            className="text-xs text-gray-400 mt-1 hover:text-gray-600"
          >
            Fechar resultados
          </button>
        )}
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {items.length} {items.length === 1 ? "restaurante" : "restaurantes"} na lista
          </p>
          {items.map((item, idx) => (
            <div
              key={item.restaurantId}
              className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 flex-shrink-0">
                  {idx + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{item.address}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === items.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <Input
                placeholder='Nota pessoal (ex: "pede o risoto")'
                value={item.note}
                onChange={(e) => updateNote(idx, e.target.value)}
                className="h-8 text-xs bg-white"
                maxLength={120}
              />
            </div>
          ))}
        </div>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-600 hover:bg-orange-700 font-semibold"
      >
        {submitting
          ? isEditing
            ? "Salvando..."
            : "Criando..."
          : isEditing
          ? "Salvar alterações"
          : "Criar lista"}
      </Button>
    </form>
  );
}
