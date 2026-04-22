import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-warm-white">
      <Sidebar user={user} />
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 md:p-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
