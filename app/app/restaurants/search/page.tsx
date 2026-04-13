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
import { toast } from "sonner";
import { Search, Plus, MapPin } from "lucide-react";
import type { Restaurant } from "@prisma/client";

export default function RestaurantSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", lat: "", lng: "" });
  const [creating, setCreating] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchRestaurants(query);
    setLoading(false);
    setSearched(true);
    if (res.success) setResults(res.data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await createRestaurant({
      name: form.name,
      address: form.address,
      lat: form.lat ? parseFloat(form.lat) : undefined,
      lng: form.lng ? parseFloat(form.lng) : undefined,
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
        <h1 className="text-2xl font-bold text-gray-900">Buscar Restaurantes</h1>
        <p className="text-sm text-gray-500">
          Encontre um restaurante ou cadastre um novo
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Nome do restaurante..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
          Buscar
        </Button>
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {!loading && searched && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-gray-500">
                Nenhum restaurante encontrado para &quot;{query}&quot;
              </p>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Cadastrar &quot;{query}&quot;
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Restaurante</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={form.name || query}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Endereço</Label>
                      <Input
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Latitude (opcional)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={form.lat}
                          onChange={(e) =>
                            setForm({ ...form, lat: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Longitude (opcional)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={form.lng}
                          onChange={(e) =>
                            setForm({ ...form, lng: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={creating}
                    >
                      {creating ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <>
              {results.map((r) => (
                <Card
                  key={r.id}
                  className="cursor-pointer hover:border-orange-300 transition-colors"
                  onClick={() => router.push(`/app/restaurants/${r.id}`)}
                >
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <p className="text-sm text-gray-500">{r.address}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="text-center pt-2">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Não encontrei — cadastrar novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Restaurante</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Endereço</Label>
                        <Input
                          value={form.address}
                          onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Latitude (opcional)</Label>
                          <Input
                            type="number"
                            step="any"
                            value={form.lat}
                            onChange={(e) =>
                              setForm({ ...form, lat: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Longitude (opcional)</Label>
                          <Input
                            type="number"
                            step="any"
                            value={form.lng}
                            onChange={(e) =>
                              setForm({ ...form, lng: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        disabled={creating}
                      >
                        {creating ? "Cadastrando..." : "Cadastrar"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
