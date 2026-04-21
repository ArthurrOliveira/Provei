import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { getListById } from "@/app/actions/lists";
import ListFormClient from "@/components/lists/ListFormClient";
import { ChevronLeft } from "lucide-react";

export default async function EditListPage({
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
  if (list.userId !== currentUser.id) notFound();

  const initialData = {
    id: list.id,
    title: list.title,
    description: list.description ?? "",
    isPublic: list.isPublic,
    items: list.items.map((item) => ({
      restaurantId: item.restaurantId,
      name: item.restaurant.name,
      address: item.restaurant.address,
      note: item.note ?? "",
    })),
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/app/lists/${listId}`}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Editar lista</h1>
          <p className="text-sm text-gray-500 truncate max-w-xs">{list.title}</p>
        </div>
      </div>

      <ListFormClient initialData={initialData} />
    </div>
  );
}
