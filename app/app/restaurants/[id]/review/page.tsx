import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { getAllVibeTags } from "@/app/actions/reviews";
import ReviewForm from "@/components/review/ReviewForm";

export default async function NewReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [restaurant, currentUser, vibeTagsRes] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id } }),
    getCurrentUser(),
    getAllVibeTags(),
  ]);

  if (!restaurant) notFound();
  if (!currentUser) redirect("/login");

  const vibeTags = (vibeTagsRes.success ? vibeTagsRes.data : []) ?? [];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova Avaliação</h1>
        <p className="text-sm text-gray-500">{restaurant.name}</p>
      </div>
      <ReviewForm
        restaurantId={id}
        userId={currentUser.id}
        vibeTags={vibeTags}
      />
    </div>
  );
}
