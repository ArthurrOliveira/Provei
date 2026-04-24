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
    badges: { badge: { slug: string; label: string } }[];
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

export type FriendReviewSummary = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  rating: number | null;
  comment: string;
  vibeTags: string[];
  reviewId: string;
  isSelf: boolean;
  topBadge: { slug: string; label: string } | null;
};

export type FriendsWhoReviewedResult = {
  direct: FriendReviewSummary[];
  fof: FriendReviewSummary[];
  aggregates: {
    count: number;
    avgRating: number | null;
    topVibeTags: string[];
  };
  hasFriendsInApp: boolean;
};

export type ListSummary = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; avatarUrl: string | null };
  _count: { items: number; likes: number };
  thumbnails: string[];
  isLiked: boolean;
};

export type ListDetailItem = {
  restaurantId: string;
  note: string | null;
  position: number;
  userRating: number | null;
  restaurant: {
    id: string;
    name: string;
    address: string;
    topVibeTags: { label: string; count: number }[];
    thumbnailUrl: string | null;
  };
};

export type ListDetail = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; avatarUrl: string | null };
  _count: { likes: number };
  isLiked: boolean;
  items: ListDetailItem[];
};
