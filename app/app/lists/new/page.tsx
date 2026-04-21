import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import ListFormClient from "@/components/lists/ListFormClient";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function NewListPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/app/lists"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nova lista</h1>
          <p className="text-sm text-gray-500">Crie uma lista de restaurantes favoritos</p>
        </div>
      </div>

      <ListFormClient />
    </div>
  );
}
