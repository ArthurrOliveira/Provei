import { getRestaurantMedia } from "@/app/actions/media";
import MediaGalleryClient from "./MediaGalleryClient";

export default async function MediaGallery({
  restaurantId,
  currentUserId,
}: {
  restaurantId: string;
  currentUserId?: string;
}) {
  const res = await getRestaurantMedia(restaurantId, "likes");
  const media = (res.success ? res.data : []) ?? [];

  if (media.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma foto ou vídeo ainda.</p>
      </div>
    );
  }

  return (
    <MediaGalleryClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      media={media as any}
      currentUserId={currentUserId}
    />
  );
}
