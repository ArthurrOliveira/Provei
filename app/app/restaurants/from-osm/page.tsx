import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { findOrCreateOsmRestaurant } from "@/app/actions/restaurants";

export default async function FromOsmPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; address?: string; lat?: string; lng?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { name, address, lat, lng } = await searchParams;

  if (!name || !lat || !lng) redirect("/app/restaurants/search");

  const res = await findOrCreateOsmRestaurant({
    name: decodeURIComponent(name),
    address: decodeURIComponent(address ?? ""),
    lat: parseFloat(lat),
    lng: parseFloat(lng),
  });

  if (!res.success) redirect("/app/restaurants/search");

  redirect(`/app/restaurants/${res.data.id}/review`);
}
