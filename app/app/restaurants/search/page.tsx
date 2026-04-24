"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchRestaurants, createRestaurant } from "@/app/actions/restaurants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import PlacesAutocomplete from "@/components/restaurants/PlacesAutocomplete";
import { toast } from "sonner";
import { Search, Plus, MapPin } from "lucide-react";
import type { Restaurant } from "@prisma/client";

export default function RestaurantSearchPage() {
  const router = useRouter();

  // Local DB search (fallback)
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Manual create dialog
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", observacao: "" });

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchRestaurants(query);
    setLoading(false);
    setSearched(true);
    if (res.success) setResults(res.data);
  }

  function openCreate() {
    setForm({ name: query, address: "", observacao: "" });
    setOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const res = await createRestaurant({
      name: form.name,
      address: form.address,
      observacao: form.observacao || undefined,
    });
    setCreating(false);
    if (res.success) {
      toast.success("Restaurante cadastrado!");
      setOpen(false);
      router.push(`/app/restaurants/${res.data.id}`);
    } else {
      toast.error("Erro: " + res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal">Buscar Restaurantes</h1>
        <p className="font-body text-sm text-sage">Encontre um restaurante ou cadastre um novo</p>
      </div>

      {/* Google Places Autocomplete */}
      <div className="space-y-2">
        <Label className="font-body font-semibold text-charcoal flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gold inline-block" />
          Buscar pelo Google Places
        </Label>
        <PlacesAutocomplete />
        <p className="font-body text-xs text-sage">
          Selecione um resultado para adicionar automaticamente com todos os dados
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1 bg-cream-dark" />
        <span className="font-body text-xs text-sage px-2">ou buscar no Mangut</span>
        <Separator className="flex-1 bg-cream-dark" />
      </div>

      {/* Local DB search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage" />
          <Input
            placeholder="Buscar restaurantes já cadastrados..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 border-cream-dark focus:border-olive focus:ring-olive/20 bg-warm-white font-body placeholder:text-sage"
          />
        </div>
        <Button type="submit" disabled={loading} className="bg-burgundy hover:bg-burgundy-light text-cream font-body">
          Buscar
        </Button>
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-cream-dark" />)}
        </div>
      )}

      {!loading && searched && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="font-body text-sage">
                Nenhum restaurante encontrado para &quot;{query}&quot; no Mangut
              </p>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 font-body border-cream-dark text-charcoal hover:bg-cream" onClick={openCreate}>
                    <Plus className="w-4 h-4" />
                    Cadastrar &quot;{query}&quot; manualmente
                  </Button>
                </DialogTrigger>
                <ManualCreateDialog
                  form={form}
                  setForm={setForm}
                  creating={creating}
                  onSubmit={handleCreate}
                />
              </Dialog>
            </div>
          ) : (
            <>
              {results.map((r) => (
                <Card
                  key={r.id}
                  className="cursor-pointer hover:border-burgundy/30 transition-colors border-cream-dark bg-warm-white"
                  onClick={() => router.push(`/app/restaurants/${r.id}`)}
                >
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-burgundy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-charcoal truncate">{r.name}</p>
                      <p className="font-body text-sm text-sage truncate">{r.address}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="text-center pt-2">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 font-body border-cream-dark text-charcoal hover:bg-cream" onClick={openCreate}>
                      <Plus className="w-4 h-4" />
                      Não encontrei — cadastrar manualmente
                    </Button>
                  </DialogTrigger>
                  <ManualCreateDialog
                    form={form}
                    setForm={setForm}
                    creating={creating}
                    onSubmit={handleCreate}
                  />
                </Dialog>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ManualCreateDialog({
  form,
  setForm,
  creating,
  onSubmit,
}: {
  form: { name: string; address: string; observacao: string };
  setForm: (f: typeof form) => void;
  creating: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-display text-charcoal">Cadastrar manualmente</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label className="font-body font-semibold text-charcoal">Nome</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="mt-1 border-cream-dark focus:border-olive font-body"
          />
        </div>
        <div>
          <Label className="font-body font-semibold text-charcoal">Endereço</Label>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
            className="mt-1 border-cream-dark focus:border-olive font-body"
          />
        </div>
        <div>
          <Label className="font-body font-semibold text-charcoal">Observação (opcional)</Label>
          <Input
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            placeholder="Ex: fica no 2º andar, estacionamento próprio..."
            className="mt-1 border-cream-dark focus:border-olive font-body placeholder:text-sage"
          />
        </div>
        <p className="font-body text-xs text-sage">
          As coordenadas serão preenchidas automaticamente pelo endereço.
        </p>
        <Button
          type="submit"
          className="w-full bg-burgundy hover:bg-burgundy-light text-cream font-body font-semibold"
          disabled={creating}
        >
          {creating ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </form>
    </DialogContent>
  );
}
