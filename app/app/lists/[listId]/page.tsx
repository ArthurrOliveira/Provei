import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/app/actions/auth";
import { getListById, deleteList } from "@/app/actions/lists";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LikeButton from "@/components/lists/LikeButton";
import ShareButton from "@/components/lists/ShareButton";
import DeleteListButton from "@/components/lists/DeleteListButton";
import { formatRelativeTime } from "@/lib/utils";
import {
  ChevronLeft,
  MapPin,
  Pencil,
  Lock,
  Map,
  BookMarked,
} from "lucide-react";

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

  const hasCoords = list.items.some(
    (item) =>
      // We don't have lat/lng in ListDetailItem; check via link construction — always show map button
      true
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/app/lists"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Listas
      </Link>

      {/* Header */}
      <div className="space-y-4">
        {/* Cover image */}
        {list.coverImageUrl && (
          <div className="relative w-full h-52 rounded-2xl overflow-hidden">
            <Image
              src={list.coverImageUrl}
              alt={list.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}

        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {list.title}
            </h1>
            {!list.isPublic && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
                <Lock className="w-3 h-3" />
                Privada
              </span>
            )}
          </div>
          {list.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{list.description}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/app/profile/${list.user.id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={list.user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-orange-200 text-orange-700 text-xs">
                {list.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-700">{list.user.name}</span>
          </Link>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(list.updatedAt)}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-xs text-gray-500">
            {list.items.length} {list.items.length === 1 ? "lugar" : "lugares"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <LikeButton
            listId={list.id}
            initialLiked={list.isLiked}
            initialCount={list._count.likes}
          />
          {list.isPublic && <ShareButton listId={list.id} />}
          {list.items.length > 0 && (
            <Link href={`/app/map?listId=${list.id}`}>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-orange-300 hover:text-orange-600 transition-all"
              >
                <Map className="w-4 h-4" />
                Ver no mapa
              </button>
            </Link>
          )}
          {isOwner && (
            <>
              <Link href={`/app/lists/${list.id}/edit`}>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-orange-300 hover:text-orange-600 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
              </Link>
              <DeleteListButton listId={list.id} />
            </>
          )}
        </div>
      </div>

      {/* Items */}
      {list.items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <BookMarked className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-500">Nenhum restaurante nesta lista ainda.</p>
          {isOwner && (
            <Link href={`/app/lists/${list.id}/edit`}>
              <Button variant="outline" size="sm">
                Adicionar restaurantes
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.items.map((item, idx) => (
            <div
              key={item.restaurantId}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-orange-200 transition-colors"
            >
              <div className="flex gap-3 p-4">
                {/* Position + thumbnail */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-6 text-center">
                    {idx + 1}
                  </span>
                  {item.restaurant.thumbnailUrl ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden">
                      <Image
                        src={item.restaurant.thumbnailUrl}
                        alt={item.restaurant.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-orange-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <Link
                    href={`/app/restaurants/${item.restaurantId}`}
                    className="font-semibold text-gray-900 hover:text-orange-600 transition-colors text-sm leading-tight"
                  >
                    {item.restaurant.name}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">
                    {item.restaurant.address}
                  </p>

                  {item.restaurant.topVibeTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {item.restaurant.topVibeTags.map((tag) => (
                        <Badge
                          key={tag.label}
                          variant="secondary"
                          className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 py-0"
                        >
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {item.note && (
                    <p className="text-xs text-orange-700 bg-orange-50 rounded-md px-2 py-1 mt-1 italic">
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
