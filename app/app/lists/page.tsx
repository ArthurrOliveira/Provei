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
      ? friendsRes.success
        ? friendsRes.data
        : []
      : mineRes.success
      ? mineRes.data
      : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listas</h1>
          <p className="text-sm text-gray-500">Lugares curados por quem você segue</p>
        </div>
        <Link href="/app/lists/new">
          <Button className="bg-orange-600 hover:bg-orange-700 gap-2">
            <Plus className="w-4 h-4" />
            Nova lista
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <Link
          href="/app/lists?filter=friends"
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            activeFilter === "friends"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          Amigos
        </Link>
        <Link
          href="/app/lists?filter=mine"
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            activeFilter === "mine"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <BookMarked className="w-3.5 h-3.5" />
          Minhas listas
        </Link>
      </div>

      {/* Lists grid */}
      {lists.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <BookMarked className="w-12 h-12 text-gray-300 mx-auto" />
          {activeFilter === "friends" ? (
            <>
              <p className="text-gray-500 font-medium">Nenhuma lista de amigos ainda</p>
              <p className="text-sm text-gray-400">
                Siga pessoas para ver as listas delas aqui
              </p>
              <Link href="/app/friends">
                <Button variant="outline" size="sm">
                  Encontrar amigos
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium">Você ainda não tem listas</p>
              <p className="text-sm text-gray-400">
                Crie sua primeira lista de restaurantes favoritos!
              </p>
              <Link href="/app/lists/new">
                <Button className="bg-orange-600 hover:bg-orange-700 gap-2" size="sm">
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
