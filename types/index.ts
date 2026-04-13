export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ReviewWithRelations = {
  id: string;
  userId: string;
  restaurantId: string;
  rating: number | null;
  comment: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
  vibeTags: {
    vibeTag: {
      id: string;
      label: string;
    };
  }[];
  media: MediaItem[];
};

export type MediaItem = {
  id: string;
  reviewId: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  thumbnailUrl: string | null;
  createdAt: Date;
  _count?: { likes: number };
};

export type VibeTagCount = {
  id: string;
  label: string;
  count: number;
};
