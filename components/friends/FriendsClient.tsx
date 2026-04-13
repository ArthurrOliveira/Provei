"use client";

import { useState } from "react";
import Link from "next/link";
import { searchUsers, followUser, unfollowUser } from "@/app/actions/social";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, UserPlus, UserMinus } from "lucide-react";

type SimpleUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export default function FriendsClient({
  currentUserId,
  initialFollowing,
}: {
  currentUserId: string;
  initialFollowing: SimpleUser[];
}) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [followingIds, setFollowingIds] = useState(
    new Set(initialFollowing.map((u) => u.id))
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await searchUsers(query, currentUserId);
    setLoading(false);
    setSearched(true);
    if (res.success && res.data) setSearchResults(res.data);
  }

  async function handleToggle(userId: string, name: string) {
    setTogglingId(userId);
    if (followingIds.has(userId)) {
      await unfollowUser(currentUserId, userId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast.success(`Deixou de seguir ${name}`);
    } else {
      await followUser(currentUserId, userId);
      setFollowingIds((prev) => new Set([...prev, userId]));
      toast.success(`Seguindo ${name}`);
    }
    setTogglingId(null);
  }

  const UserRow = ({ user }: { user: SimpleUser }) => (
    <Card className="hover:border-orange-200 transition-colors">
      <CardContent className="flex items-center gap-3 py-3">
        <Link href={`/app/profile/${user.id}`}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-orange-200 text-orange-700 text-sm">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Link
          href={`/app/profile/${user.id}`}
          className="flex-1 font-medium text-sm hover:text-orange-600"
        >
          {user.name}
        </Link>
        <Button
          size="sm"
          variant={followingIds.has(user.id) ? "outline" : "default"}
          disabled={togglingId === user.id}
          onClick={() => handleToggle(user.id, user.name)}
          className={
            followingIds.has(user.id)
              ? "border-orange-300 text-orange-600"
              : "bg-orange-600 hover:bg-orange-700"
          }
        >
          {followingIds.has(user.id) ? (
            <>
              <UserMinus className="w-3.5 h-3.5 mr-1" />
              Seguindo
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Seguir
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar pessoas por nome..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Buscar
        </Button>
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {searched && !loading && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Resultados
          </h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum usuário encontrado.</p>
          ) : (
            searchResults.map((user) => <UserRow key={user.id} user={user} />)
          )}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Quem você segue ({initialFollowing.length})
        </h2>
        {initialFollowing.length === 0 ? (
          <p className="text-sm text-gray-500">
            Você ainda não segue ninguém. Use a busca acima para encontrar amigos!
          </p>
        ) : (
          initialFollowing.map((user) => <UserRow key={user.id} user={user} />)
        )}
      </div>
    </div>
  );
}
