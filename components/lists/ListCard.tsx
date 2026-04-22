import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { Heart, BookMarked, Lock } from "lucide-react";
import type { ListSummary } from "@/types";

function ThumbnailCollage({ thumbnails }: { thumbnails: string[] }) {
  const count = thumbnails.length;

  if (count === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center">
        <BookMarked className="w-10 h-10 text-sage" />
      </div>
    );
  }

  if (count === 1) {
    return (
      <Image src={thumbnails[0]} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 400px" />
    );
  }

  if (count === 2) {
    return (
      <div className="flex h-full w-full gap-px">
        {thumbnails.map((url, i) => (
          <div key={i} className="relative flex-1 h-full overflow-hidden">
            <Image src={url} alt="" fill className="object-cover" sizes="200px" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-px h-full w-full">
      <div className="relative col-span-1 row-span-2 overflow-hidden">
        <Image src={thumbnails[0]} alt="" fill className="object-cover" sizes="200px" />
      </div>
      <div className="relative overflow-hidden">
        <Image src={thumbnails[1]} alt="" fill className="object-cover" sizes="100px" />
      </div>
      <div className="relative overflow-hidden">
        <Image src={thumbnails[2]} alt="" fill className="object-cover" sizes="100px" />
      </div>
    </div>
  );
}

export default function ListCard({ list }: { list: ListSummary }) {
  const cover = list.coverImageUrl ?? null;

  return (
    <Link href={`/app/lists/${list.id}`}>
      <div className="group bg-warm-white rounded-2xl border border-cream-dark overflow-hidden hover:border-burgundy/30 hover:shadow-sm transition-all">
        <div className="relative h-40 w-full overflow-hidden bg-cream">
          {cover ? (
            <Image
              src={cover}
              alt={list.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 400px"
            />
          ) : (
            <ThumbnailCollage thumbnails={list.thumbnails} />
          )}
          {!list.isPublic && (
            <span className="absolute top-2 right-2 flex items-center gap-1 bg-charcoal/70 text-cream text-xs font-body px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" />
              Privada
            </span>
          )}
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-charcoal text-sm leading-tight line-clamp-2">
              {list.title}
            </h3>
            <span className="flex items-center gap-1 text-xs text-sage font-body flex-shrink-0">
              <Heart className="w-3.5 h-3.5" />
              {list._count.likes}
            </span>
          </div>

          {list.description && (
            <p className="font-body text-xs text-sage leading-relaxed line-clamp-2">
              {truncate(list.description, 100)}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5">
                <AvatarImage src={list.user.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-olive text-cream text-[10px] font-body">
                  {list.user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-body text-xs text-sage truncate max-w-[100px]">
                {list.user.name}
              </span>
            </div>
            <span className="font-body text-xs text-sage">
              {list._count.items}{" "}
              {list._count.items === 1 ? "lugar" : "lugares"} ·{" "}
              {formatRelativeTime(list.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
