"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type LatLng = { lat: number; lng: number };

const SWEDEN_CENTER: [number, number] = [62.4, 16.3];
const SWEDEN_ZOOM = 5;
const PICK_ZOOM = 15;
const STATIC_ZOOM = 14;

// Leaflets default-markörikon pekar på PNG-filer som går sönder under
// bundlers — en inline-SVG via divIcon undviker assets helt.
const PIN_HTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path d="M16 1C8.3 1 2 7.3 2 15c0 10.5 14 26 14 26s14-15.5 14-26C30 7.3 23.7 1 16 1z" fill="var(--color-primary)" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15" r="5" fill="#fff"/></svg>`;

export function MapPicker({
  value,
  onChange,
  interactive = true,
  className = "",
}: {
  value: LatLng | null;
  onChange?: (pos: LatLng) => void;
  interactive?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);

  // Håll refs i synk (deklarerad före init-effekten så den kör först).
  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  }, [onChange, value]);

  const placeMarker = (pos: LatLng) => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([pos.lat, pos.lng]);
      return;
    }
    const marker = L.marker([pos.lat, pos.lng], {
      icon: L.divIcon({
        html: PIN_HTML,
        className: "",
        iconSize: [32, 42],
        iconAnchor: [16, 41],
      }),
      draggable: interactive,
      keyboard: false,
    }).addTo(map);
    if (interactive)
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onChangeRef.current?.({ lat: p.lat, lng: p.lng });
      });
    markerRef.current = marker;
  };

  const pick = (pos: LatLng) => {
    placeMarker(pos);
    const map = mapRef.current;
    if (map && map.getZoom() < 13) map.flyTo([pos.lat, pos.lng], PICK_ZOOM);
    onChangeRef.current?.(pos);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import("leaflet");
      const L = (mod.default ?? mod) as typeof Leaflet;
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      });
      mapRef.current = map;

      // Leaflet mäter containern vid init, som kan ske innan layouten är
      // klar — håll kartstorleken i synk så alla tiles ritas.
      const obs = new ResizeObserver(() => map.invalidateSize());
      obs.observe(containerRef.current);
      resizeObsRef.current = obs;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare',
      }).addTo(map);

      const initial = valueRef.current;
      if (initial) {
        map.setView(
          [initial.lat, initial.lng],
          interactive ? PICK_ZOOM : STATIC_ZOOM,
        );
      } else {
        map.setView(SWEDEN_CENTER, SWEDEN_ZOOM);
        if (interactive && navigator.geolocation)
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              // Centrera bara — pinnen placeras först när användaren pekar.
              if (!cancelled && !valueRef.current)
                map.setView(
                  [pos.coords.latitude, pos.coords.longitude],
                  PICK_ZOOM,
                );
            },
            () => {},
            { timeout: 5000, maximumAge: 60000 },
          );
      }

      if (interactive)
        map.on("click", (e: Leaflet.LeafletMouseEvent) =>
          pick({ lat: e.latlng.lat, lng: e.latlng.lng }),
        );
      setReady(true);
    })();
    return () => {
      cancelled = true;
      resizeObsRef.current?.disconnect();
      resizeObsRef.current = null;
      // StrictMode kör effekten dubbelt i dev — utan remove() kastar
      // Leaflet "Map container is already initialized".
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  useEffect(() => {
    if (!ready || !value) return;
    placeMarker(value);
    if (!interactive)
      mapRef.current?.setView([value.lat, value.lng], STATIC_ZOOM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, value, interactive]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current?.flyTo([p.lat, p.lng], PICK_ZOOM);
        pick(p);
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 60000 },
    );
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {interactive && (
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="absolute bottom-3 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-[13px] font-bold text-ink shadow-card disabled:opacity-60"
        >
          <LocateFixed size={15} strokeWidth={2} />
          {locating ? "Hämtar plats…" : "Använd min plats"}
        </button>
      )}
    </div>
  );
}
