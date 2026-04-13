"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createIcon(count: number) {
  const size = count >= 5 ? 44 : count >= 3 ? 38 : 30;
  const color = count >= 5 ? "#ea580c" : count >= 3 ? "#f97316" : "#fb923c";
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:bold;font-size:${count >= 10 ? 11 : 13}px;
      box-shadow:0 2px 8px rgba(0,0,0,.35);">
      ${count}
    </div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

type MapRestaurant = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  reviewCount: number;
  topTags: { id: string; label: string; count: number }[];
};

export default function MapView({ restaurants }: { restaurants: MapRestaurant[] }) {
  const [center, setCenter] = useState<[number, number]>([-23.5505, -46.6333]); // São Paulo

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      zoomControl={true}
    >
      <RecenterMap lat={center[0]} lng={center[1]} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {restaurants.map((r) => (
        <Marker
          key={r.id}
          position={[r.lat, r.lng]}
          icon={createIcon(r.reviewCount)}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-semibold text-sm">{r.name}</p>
              <p className="text-xs text-gray-500 mb-1">{r.address}</p>
              <p className="text-xs text-gray-400 mb-2">
                {r.reviewCount} avaliação{r.reviewCount !== 1 ? "ões" : ""} de amigos
              </p>
              {r.topTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {r.topTags.map((t) => (
                    <span
                      key={t.id}
                      className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full"
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              )}
              <a
                href={`/app/restaurants/${r.id}`}
                className="block text-center text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600"
              >
                Ver restaurante
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
