import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/app/actions/auth";
import { getListById } from "@/app/actions/lists";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LikeButton from "@/components/lists/LikeButton";
import ShareButton from "@/components/lists/ShareButton";
import DeleteListButton from "@/components/lists/DeleteListButton";
import { formatRelativeTime } from "@/lib/utils";
import { ChevronLeft, MapPin, Pencil, Lock, Map, BookMarked } from "lucide-react";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const res = await getListById(listId, currentUser.id);
  if (!res.success || !res.data) notFound();

  const list = res.data;
  const isOwner = list.userId === currentUser.id;

  if (!list.isPublic && !isOwner) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/app/lists" className="inline-flex items-center gap-1 text-sm font-body text-sage hover:text-charcoal">
        <ChevronLeft className="w-4 h-4" />
        Listas
      </Link>

      <div className="space-y-4">
        {list.coverImageUrl && (
          <div className="relative w-full h-52 rounded-2xl overflow-hidden">
            <Image src={list.coverImageUrl} alt={list.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-charcoal leading-tight">{list.title}</h1>
            {!list.isPublic && (
              <span className="flex items-center gap-1 text-xs font-body text-sage bg-cream px-2 py-1 rounded-full flex-shrink-0 border border-cream-dark">
                <Lock className="w-3 h-3" />
                Privada
              </span>
            )}
          </div>
          {list.description && (
            <p className="font-body text-charcoal/70 text-sm leading-relaxed">{list.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link href={`/app/profile/${list.user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar className="w-7 h-7">
              <AvatarImage src={list.user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-olive text-cream text-xs font-body">
                {list.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-body text-sm font-medium text-charcoal">{list.user.name}</span>
          </Link>
          <span className="text-cream-dark">·</span>
          <span className="font-body text-xs text-sage">{formatRelativeTime(list.updatedAt)}</span>
          <span className="text-cream-dark">·</span>
          <span className="font-body text-xs text-sage">{list.items.length} {list.items.length === 1 ? "lugar" : "lugares"}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <LikeButton listId={list.id} initialLiked={list.isLiked} initialCount={list._count.likes} />
          {list.isPublic && <ShareButton listId={list.id} />}
          {list.items.length > 0 && (
            <Link href={`/app/map?listId=${list.id}`}>
              <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-cream-dark text-sm font-body font-medium text-charcoal bg-warm-white hover:border-olive hover:text-olive transition-all">
                <Map className="w-4 h-4" />
                Ver no mapa
              </button>
            </Link>
          )}
          {isOwner && (
            <>
              <Link href={`/app/lists/${list.id}/edit`}>
                <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-cream-dark text-sm font-body font-medium text-charcoal bg-warm-white hover:border-burgundy/40 hover:text-burgundy transition-all">
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
              </Link>
              <DeleteListButton listId={list.id} />
            </>
          )}
        </div>
      </div>

      {list.items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <BookMarked className="w-10 h-10 text-cream-dark mx-auto" />
          <p className="font-body text-sage">Nenhum restaurante nesta lista ainda.</p>
          {isOwner && (
            <Link href={`/app/lists/${list.id}/edit`}>
              <Button variant="outline" size="sm" className="font-body border-cream-dark text-charcoal hover:bg-cream">
                Adicionar restaurantes
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.items.map((item, idx) => (
            <div key={item.restaurantId} className="bg-warm-white rounded-xl border border-cream-dark overflow-hidden hover:border-burgundy/20 transition-colors">
              <div className="flex gap-3 p-4">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <span className="font-body text-xs font-bold text-sage w-6 text-center">{idx + 1}</span>
                  {item.restaurant.thumbnailUrl ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden">
                      <Image src={item.restaurant.thumbnailUrl} alt={item.restaurant.name} fill className="object-cover" sizes="56px" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-cream flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-sage" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <Link href={`/app/restaurants/${item.restaurantId}`} className="font-display font-semibold text-charcoal hover:text-burgundy transition-colors text-sm leading-tight">
                    {item.restaurant.name}
                  </Link>
                  <p className="font-body text-xs text-sage truncate">{item.restaurant.address}</p>

                  {item.restaurant.topVibeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {item.restaurant.topVibeTags.map((tag) => (
                        <Badge key={tag.label} variant="secondary" className="text-xs bg-olive/10 text-olive-dark font-body py-0">
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {item.note && (
                    <p className="font-body text-xs text-burgundy bg-cream rounded-md px-2 py-1 mt-1 italic border border-cream-dark">
                      💬 {item.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
