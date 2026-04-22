import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { getListsFromFriends, getListsByUser } from "@/app/actions/lists";
import ListCard from "@/components/lists/ListCard";
import { Button } from "@/components/ui/button";
import { Plus, BookMarked, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { filter } = await searchParams;
  const activeFilter = filter === "mine" ? "mine" : "friends";

  const [friendsRes, mineRes] = await Promise.all([
    activeFilter === "friends"
      ? getListsFromFriends(currentUser.id)
      : Promise.resolve({ success: true as const, data: [] }),
    activeFilter === "mine"
      ? getListsByUser(currentUser.id, currentUser.id, true)
      : Promise.resolve({ success: true as const, data: [] }),
  ]);

  const lists =
    activeFilter === "friends"
      ? friendsRes.success ? friendsRes.data : []
      : mineRes.success ? mineRes.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal">Listas</h1>
          <p className="font-body text-sm text-sage">Lugares curados por quem você segue</p>
        </div>
        <Link href="/app/lists/new">
          <Button className="bg-burgundy hover:bg-burgundy-light text-cream font-body gap-2">
            <Plus className="w-4 h-4" />
            Nova lista
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-cream p-1 rounded-xl w-fit border border-cream-dark">
        <Link
          href="/app/lists?filter=friends"
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-body font-medium transition-all",
            activeFilter === "friends"
              ? "bg-warm-white text-charcoal shadow-sm"
              : "text-sage hover:text-charcoal"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          Amigos
        </Link>
        <Link
          href="/app/lists?filter=mine"
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-body font-medium transition-all",
            activeFilter === "mine"
              ? "bg-warm-white text-charcoal shadow-sm"
              : "text-sage hover:text-charcoal"
          )}
        >
          <BookMarked className="w-3.5 h-3.5" />
          Minhas listas
        </Link>
      </div>

      {/* Lists grid */}
      {lists.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <BookMarked className="w-12 h-12 text-cream-dark mx-auto" />
          {activeFilter === "friends" ? (
            <>
              <p className="font-body text-charcoal font-medium">Nenhuma lista de amigos ainda</p>
              <p className="font-body text-sm text-sage">Siga pessoas para ver as listas delas aqui</p>
              <Link href="/app/friends">
                <Button variant="outline" size="sm" className="font-body border-cream-dark text-charcoal hover:bg-cream">
                  Encontrar amigos
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="font-body text-charcoal font-medium">Você ainda não tem listas</p>
              <p className="font-body text-sm text-sage">Crie sua primeira lista de restaurantes favoritos!</p>
              <Link href="/app/lists/new">
                <Button className="bg-burgundy hover:bg-burgundy-light text-cream font-body gap-2" size="sm">
                  <Plus className="w-4 h-4" />
                  Criar minha primeira lista
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}
