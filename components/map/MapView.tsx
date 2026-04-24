"use client";

import { useEffect, useState, useCallback } from "react";
import Map, { Source, Layer, Popup, NavigationControl, GeolocateControl } from "react-map-gl/maplibre";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";

type MapRestaurant = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  reviewCount: number;
  avgRating: number | null;
  topTags: { id: string; label: string; count: number }[];
};

type PopupInfo = {
  longitude: number;
  latitude: number;
  restaurant: MapRestaurant;
};

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

function toGeoJSON(restaurants: MapRestaurant[]): FeatureCollection<Point> {
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
        avgRating: r.avgRating,
        topTags: JSON.stringify(r.topTags),
      },
    })),
  };
}

export default function MapView({
  restaurants,
  focusRestaurant,
}: {
  restaurants: MapRestaurant[];
  focusRestaurant?: { lat: number; lng: number; restaurantId: string | null } | null;
}) {
  const [viewState, setViewState] = useState({
    longitude: focusRestaurant?.lng ?? -46.6333,
    latitude: focusRestaurant?.lat ?? -23.5505,
    zoom: focusRestaurant ? 16 : 13,
  });
  const [popup, setPopup] = useState<PopupInfo | null>(() => {
    if (!focusRestaurant?.restaurantId) return null;
    const r = restaurants.find((r) => r.id === focusRestaurant.restaurantId);
    if (!r) return null;
    return { longitude: r.lng, latitude: r.lat, restaurant: r };
  });
  const [geolocated, setGeolocated] = useState(!!focusRestaurant);

  useEffect(() => {
    if (geolocated) return;
    navigator.geolocation?.getCurrentPosition((pos) => {
      setViewState((v) => ({
        ...v,
        longitude: pos.coords.longitude,
        latitude: pos.coords.latitude,
      }));
      setGeolocated(true);
    });
  }, [geolocated]);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      if (!feature) return;

      // Clique em cluster → zoom in
      if (feature.properties?.cluster) {
        const source = e.target.getSource("restaurants") as GeoJSONSource;
        source.getClusterExpansionZoom(feature.properties.cluster_id).then((zoom) => {
          if (zoom == null) return;
          const coords = (feature.geometry as Point).coordinates as [number, number];
          setViewState((v) => ({ ...v, longitude: coords[0], latitude: coords[1], zoom }));
        }).catch(() => {});
        return;
      }

      // Clique em pin individual → popup
      const coords = (feature.geometry as Point).coordinates as [number, number];
      const r: MapRestaurant = {
        id: feature.properties!.id,
        name: feature.properties!.name,
        address: feature.properties!.address,
        reviewCount: feature.properties!.reviewCount,
        avgRating: feature.properties!.avgRating ?? null,
        topTags: JSON.parse(feature.properties!.topTags ?? "[]"),
        lat: coords[1],
        lng: coords[0],
      };
      setPopup({ longitude: coords[0], latitude: coords[1], restaurant: r });
    },
    []
  );

  const geojson = toGeoJSON(restaurants);

  return (
    <Map
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      onClick={handleClick}
      interactiveLayerIds={["clusters", "unclustered-point"]}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl
        position="top-right"
        trackUserLocation
      />

      <Source
        id="restaurants"
        type="geojson"
        data={geojson}
        cluster={true}
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        {/* Círculo de cluster */}
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": [
              "step", ["get", "point_count"],
              "#A8B89A",   // 1–4
              5, "#4A5A3C",  // 5–9
              10, "#5C191E", // 10+
            ],
            "circle-radius": [
              "step", ["get", "point_count"],
              18,
              5, 24,
              10, 30,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FDFAF6",
          }}
        />

        {/* Contagem dentro do cluster */}
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

        {/* Pin individual */}
        <Layer
          id="unclustered-point"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": [
              "case",
              [">", ["get", "reviewCount"], 0], "#5C191E",
              "#A8B89A",
            ],
            "circle-radius": [
              "case",
              [">", ["get", "reviewCount"], 0], 14,
              9,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FDFAF6",
          }}
        />

        {/* Nota média dentro do pin */}
        <Layer
          id="unclustered-label"
          type="symbol"
          filter={["all", ["!", ["has", "point_count"]], [">", ["get", "reviewCount"], 0], ["!=", ["get", "avgRating"], null]]}
          layout={{
            "text-field": ["to-string", ["get", "avgRating"]],
            "text-size": 11,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          }}
          paint={{ "text-color": "#FDFAF6" }}
        />
      </Source>

      {popup && (
        <Popup
          longitude={popup.longitude}
          latitude={popup.latitude}
          anchor="bottom"
          onClose={() => setPopup(null)}
          closeButton={true}
          maxWidth="240px"
        >
          <div style={{ fontFamily: "Nunito, sans-serif", padding: "4px 0" }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: "#2C2826", margin: "0 0 3px" }}>
              {popup.restaurant.name}
            </p>
            <p style={{ fontSize: 12, color: "#9E8E7E", margin: "0 0 6px" }}>
              {popup.restaurant.address}
            </p>

            {popup.restaurant.reviewCount > 0 ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {popup.restaurant.avgRating != null && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#5C191E" }}>
                      ★ {popup.restaurant.avgRating}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "#9E8E7E" }}>
                    ({popup.restaurant.reviewCount} avaliação{popup.restaurant.reviewCount !== 1 ? "ões" : ""})
                  </span>
                </div>
                {popup.restaurant.topTags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    {popup.restaurant.topTags.map((t) => (
                      <span
                        key={t.id}
                        style={{
                          fontSize: 11,
                          background: "#EEF2EA",
                          color: "#4A5A3C",
                          padding: "2px 8px",
                          borderRadius: 99,
                        }}
                      >
                        {t.label}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 12, color: "#A8B89A", margin: "0 0 8px" }}>
                Nenhuma avaliação ainda
              </p>
            )}

            <a
              href={`/app/restaurants/${popup.restaurant.id}`}
              style={{
                display: "block",
                textAlign: "center",
                fontSize: 12,
                fontWeight: 600,
                background: "#5C191E",
                color: "#F5EDE3",
                padding: "6px 12px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Ver restaurante →
            </a>
          </div>
        </Popup>
      )}
    </Map>
  );
}
