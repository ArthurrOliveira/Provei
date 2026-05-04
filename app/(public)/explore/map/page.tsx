import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getPublicMapRestaurants } from "@/app/actions/public";

export const metadata: Metadata = {
  title: "Mapa de restaurantes | mangút",
  description: "Descubra restaurantes avaliados no mangút perto de você.",
};

const ExploreMapView = dynamic(
  () => import("@/components/map/ExploreMapView"),
  { ssr: false }
);

export default async function ExploreMapPage() {
  const restaurants = await getPublicMapRestaurants();

  return (
    <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6 relative">
      {/* Fog of war banner */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-burgundy/90 backdrop-blur-sm text-cream text-xs font-body font-semibold rounded-full px-4 py-1.5 shadow whitespace-nowrap pointer-events-none">
        Entre pra ver quem dos seus amigos foi onde
      </div>

      <div style={{ height: "calc(100vh - 4rem)" }}>
        <ExploreMapView restaurants={restaurants} />
      </div>
    </div>
  );
}
