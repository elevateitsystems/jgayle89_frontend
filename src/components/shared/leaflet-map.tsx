"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  href?: string;
  image?: string;
}

interface Props {
  markers: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** When set, clicking the map reports coordinates (location picker). */
  onPick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  /** Single-marker maps zoom here. */
  singleZoom?: number;
  className?: string;
}

const PIN_SVG = (fill: string) =>
  `<svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17 1C8.7 1 2 7.6 2 15.8 2 27 17 43 17 43s15-16 15-27.2C32 7.6 25.3 1 17 1Z" fill="${fill}" stroke="#fbf9f4" stroke-width="2"/>
    <circle cx="17" cy="16" r="5.5" fill="#fbf9f4"/>
  </svg>`;

function makeIcon(active: boolean) {
  return L.divIcon({
    className: `sitrep-pin${active ? " active" : ""}`,
    html: PIN_SVG(active ? "#b4862f" : "#435229"),
    iconSize: [34, 44],
    iconAnchor: [17, 43],
    popupAnchor: [0, -38],
  });
}

function popupEl(m: MapMarker, onGo: (href: string) => void) {
  const el = document.createElement("div");
  el.className = "text-left";
  if (m.image) {
    const img = document.createElement("img");
    img.src = m.image;
    img.alt = "";
    img.style.cssText = "width:100%;height:96px;object-fit:cover;display:block;";
    el.appendChild(img);
  }
  const body = document.createElement("div");
  body.style.cssText = "padding:10px 12px 12px;";
  const t = document.createElement("div");
  t.textContent = m.title;
  t.style.cssText = "font-weight:600;font-size:14px;color:#161b0e;line-height:1.25;";
  body.appendChild(t);
  if (m.subtitle) {
    const s = document.createElement("div");
    s.textContent = m.subtitle;
    s.style.cssText = "font-size:12px;color:#5b6149;margin-top:2px;";
    body.appendChild(s);
  }
  if (m.href) {
    const a = document.createElement("a");
    a.href = m.href;
    a.textContent = "View details →";
    a.style.cssText = "display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#435229;text-decoration:underline;";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      onGo(m.href!);
    });
    body.appendChild(a);
  }
  el.appendChild(body);
  return el;
}

export default function LeafletMap({
  markers,
  selectedId,
  onSelect,
  onPick,
  interactive = true,
  singleZoom = 13,
  className,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const pickRef = useRef(onPick);
  const selectRef = useRef(onSelect);
  const routerRef = useRef(router);
  useEffect(() => {
    pickRef.current = onPick;
    selectRef.current = onSelect;
    routerRef.current = router;
  });

  // Create map once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    const markersMap = markerRefs.current;
    const map = L.map(el, {
      zoomControl: interactive,
      scrollWheelZoom: false,
      dragging: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      attributionControl: true,
      worldCopyJump: true,
    }).setView([38.5, -96], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on("click", (e: L.LeafletMouseEvent) => pickRef.current?.(e.latlng.lat, e.latlng.lng));
    if (interactive) {
      // Enable wheel zoom only after the user interacts, so page scroll isn't hijacked.
      map.on("focus", () => map.scrollWheelZoom.enable());
      map.on("blur", () => map.scrollWheelZoom.disable());
    }

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersMap.clear();
    };
  }, [interactive]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markerRefs.current.clear();

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: makeIcon(false), title: m.title, keyboard: true, alt: m.title });
      marker.bindPopup(popupEl(m, (href) => routerRef.current.push(href)), { closeButton: true, autoPanPadding: [24, 24] });
      marker.on("click", () => selectRef.current?.(m.id));
      marker.addTo(layer);
      markerRefs.current.set(m.id, marker);
    });

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], singleZoom, { animate: false });
    } else if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9, animate: false });
    }
  }, [markers, singleZoom]);

  // Highlight selection
  useEffect(() => {
    markerRefs.current.forEach((marker, id) => {
      marker.setIcon(makeIcon(id === selectedId));
      marker.setZIndexOffset(id === selectedId ? 1000 : 0);
    });
    if (selectedId) {
      const m = markerRefs.current.get(selectedId);
      const map = mapRef.current;
      if (m && map) {
        map.panTo(m.getLatLng(), { animate: true });
        if (!m.isPopupOpen()) m.openPopup();
      }
    }
  }, [selectedId, markers]);

  return <div ref={containerRef} className={className} role="region" aria-label="Interactive map" />;
}
