"use client";

import { useCallback, useState } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import LoginGate from "@/components/LoginGate";
import { Button } from "@/components/ui/button";

type ExploreRestaurant = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  reviewCount: number;
};

type PopupInfo = {
  longitude: number;
  latitude: number;
  restaurant: ExploreRestaurant;
};

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

function toGeoJSON(
  restaurants: ExploreRestaurant[]
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: restaurants.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
      properties: {
        id: r.id,
        name: r.name,
        address: r.address,
        reviewCount: r.reviewCount,
      },
    })),
  };
}

export default function ExploreMapView({
  restaurants,
}: {
  restaurants: ExploreRestaurant[];
}) {
  const [viewState, setViewState] = useState({
    longitude: -46.6333,
    latitude: -23.5505,
    zoom: 12,
  });
  const [popup, setPopup] = useState<PopupInfo | null>(null);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;

    if (feature.properties?.cluster) return;

    const coords = (feature.geometry as Point).coordinates as [
      number,
      number
    ];
    setPopup({
      longitude: coords[0],
      latitude: coords[1],
      restaurant: {
        id: feature.properties!.id,
        name: feature.properties!.name,
        address: feature.properties!.address,
        lat: coords[1],
        lng: coords[0],
        reviewCount: feature.properties!.reviewCount,
      },
    });
  }, []);

  const geojson = toGeoJSON(restaurants);

  return (
    <Map
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onClick={handleClick}
      interactiveLayerIds={["unclustered-point", "clusters"]}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" trackUserLocation />

      <Source
        id="restaurants"
        type="geojson"
        data={geojson}
        cluster={true}
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": "#A8B89A",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              5,
              24,
              10,
              30,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FDFAF6",
          }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": "{point_count_abbreviated}",
            "text-size": 13,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          }}
          paint={{ "text-color": "#FDFAF6" }}
        />
        <Layer
          id="unclustered-point"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": "#A8B89A",
            "circle-radius": 10,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FDFAF6",
          }}
        />
      </Source>

      {popup && (
        <Popup
          longitude={popup.longitude}
          latitude={popup.latitude}
          anchor="bottom"
          onClose={() => setPopup(null)}
          closeButton={true}
          maxWidth="220px"
        >
          <div
            style={{
              fontFamily: "Nunito, sans-serif",
              padding: "4px 0",
            }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "#2C2826",
                margin: "0 0 2px",
              }}
            >
              {popup.restaurant.name}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "#9E8E7E",
                margin: "0 0 8px",
              }}
            >
              {popup.restaurant.reviewCount} avaliações no mangút
            </p>
            <LoginGate
              action="map"
              returnTo={`/explore/map`}
              href={`/app/restaurants/${popup.restaurant.id}`}
            >
              <Button
                size="sm"
                className="w-full bg-burgundy text-cream text-xs font-body"
              >
                Ver quem avaliou →
              </Button>
            </LoginGate>
          </div>
        </Popup>
      )}
    </Map>
  );
}
