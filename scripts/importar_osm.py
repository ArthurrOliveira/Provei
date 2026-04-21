# -*- coding: utf-8 -*-
"""
importar_osm.py
---------------
Importa restaurantes da Zona Sul do Rio de Janeiro via OpenStreetMap (Overpass API)
e insere na tabela tastecircle.Restaurant do Supabase.
"""

import uuid
import time
import psycopg2
import requests

DB_URL = "postgresql://postgres:Beico%4023426@db.kowqefwnifxnfcmkclrv.supabase.co:5432/postgres"

# Bounding boxes por bairro (sul, oeste, norte, leste)
BAIRROS = {
    "Ipanema":         (-23.0175, -43.2050, -22.9840, -43.1860),
    "Leblon":          (-23.0175, -43.2280, -22.9850, -43.2050),
    "Copacabana":      (-23.0130, -43.1960, -22.9690, -43.1720),
    "Leme":            (-22.9700, -43.1740, -22.9580, -43.1590),
    "Botafogo":        (-22.9530, -43.1900, -22.9280, -43.1700),
    "Flamengo":        (-22.9380, -43.1780, -22.9200, -43.1620),
    "Catete":          (-22.9310, -43.1750, -22.9180, -43.1640),
    "Laranjeiras":     (-22.9420, -43.1920, -22.9220, -43.1770),
    "Humaitá":         (-22.9480, -43.2000, -22.9280, -43.1870),
    "Lagoa":           (-22.9780, -43.2150, -22.9540, -43.1950),
    "Jardim Botânico": (-22.9780, -43.2300, -22.9570, -43.2130),
    "Gávea":           (-22.9830, -43.2450, -22.9660, -43.2270),
    "Urca":            (-22.9520, -43.1670, -22.9420, -43.1550),
    "Santa Teresa":    (-22.9280, -43.1870, -22.9100, -43.1700),
    "Vidigal":         (-23.0050, -43.2420, -22.9900, -43.2260),
}

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

QUERY_BBOX = """
[out:json][timeout:60];
(
  node["amenity"="restaurant"]({s},{w},{n},{e});
  way["amenity"="restaurant"]({s},{w},{n},{e});
);
out center tags;
"""


def buscar_restaurantes_bairro(bairro: str, bbox: tuple) -> list[dict]:
    s, w, n, e = bbox
    query = QUERY_BBOX.format(s=s, w=w, n=n, e=e)
    try:
        headers = {"User-Agent": "Mangut/1.0 (app de avaliacao de restaurantes)"}
        resp = requests.post(OVERPASS_URL, data={"data": query}, headers=headers, timeout=90)
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
        restaurants = []
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name", "").strip()
            if not name:
                continue
            lat = el.get("lat") or (el.get("center") or {}).get("lat")
            lng = el.get("lon") or (el.get("center") or {}).get("lon")
            if not lat or not lng:
                continue
            street = tags.get("addr:street", "")
            number = tags.get("addr:housenumber", "")
            address = f"{street}, {number}".strip(", ") if street else bairro
            restaurants.append({
                "name": name,
                "address": address,
                "lat": float(lat),
                "lng": float(lng),
            })
        return restaurants
    except Exception as e:
        print(f"  [ERRO] {bairro}: {e}")
        return []


def main():
    print("=" * 60)
    print("  IMPORTADOR OSM — Zona Sul Rio de Janeiro")
    print("=" * 60)

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    total_inseridos = 0
    total_ignorados = 0

    for bairro, bbox in BAIRROS.items():
        print(f"\n[...] Buscando restaurantes em {bairro}...")
        restaurantes = buscar_restaurantes_bairro(bairro, bbox)
        print(f"  Encontrados: {len(restaurantes)}")

        for r in restaurantes:
            cur.execute(
                'SELECT 1 FROM tastecircle."Restaurant" WHERE name = %s AND lat = %s',
                (r["name"], r["lat"])
            )
            if cur.fetchone():
                total_ignorados += 1
                continue

            cur.execute(
                '''INSERT INTO tastecircle."Restaurant" (id, name, address, lat, lng, "createdAt")
                   VALUES (%s, %s, %s, %s, %s, NOW())''',
                (str(uuid.uuid4()), r["name"], r["address"], r["lat"], r["lng"])
            )
            total_inseridos += 1

        time.sleep(2)

    conn.close()

    print("\n" + "=" * 60)
    print("  RESUMO")
    print("=" * 60)
    print(f"  Bairros processados : {len(BAIRROS)}")
    print(f"  Restaurantes novos  : {total_inseridos}")
    print(f"  Já existiam         : {total_ignorados}")
    print("=" * 60)


if __name__ == "__main__":
    main()
