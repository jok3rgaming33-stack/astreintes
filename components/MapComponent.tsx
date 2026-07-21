"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { PEOPLE, ROLE_COLORS, ROLE_LABELS, type Person, type Role } from "@/lib/people";
import type { SignalPoint } from "@/components/AddressSearch";

interface MapComponentProps {
  activeRoles: Set<Role>;
  searchQuery: string;
  onPersonSelect: (person: Person | null) => void;
  selectedPerson: Person | null;
  signalPoint: SignalPoint | null;
  clickModeActive: boolean;
  onMapClick: (point: SignalPoint) => void;
}

export default function MapComponent({
  activeRoles,
  searchQuery,
  onPersonSelect,
  selectedPerson,
  signalPoint,
  clickModeActive,
  onMapClick,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<Person, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const signalMarkerRef = useRef<L.Marker | null>(null);
  const clickModeRef = useRef(clickModeActive);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [46.2, -0.5],
      zoom: 7,
      zoomControl: false,
    });

    // OSM-FR tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &mdash; Tiles by <a href="https://openstreetmap.fr">OSM France</a>',
      maxZoom: 19,
    }).addTo(map);

    // Custom zoom control
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Map click handler for signal placement
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!clickModeRef.current) return;
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng, label: "Point signalé" });
    });

    mapRef.current = map;

    // Create markers for all people
    PEOPLE.forEach((person) => {
      const initials = `${person.prenom[0]}${person.nom[0]}`.toUpperCase();
      const color = ROLE_COLORS[person.role];

      const icon = L.divIcon({
        className: "",
        html: `<div class="person-marker" style="background-color:${color};">${initials}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([person.lat, person.lng], { icon })
        .addTo(map)
        .on("click", () => onPersonSelect(person));

      markersRef.current.set(person, marker);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep clickModeRef in sync so the map click closure always sees latest value
  useEffect(() => {
    clickModeRef.current = clickModeActive;
  }, [clickModeActive]);

  // Update marker visibility based on active roles & search
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const q = searchQuery.toLowerCase();

    PEOPLE.forEach((person) => {
      const marker = markersRef.current.get(person);
      if (!marker) return;

      const matchesRole = activeRoles.has(person.role);
      const matchesSearch =
        q === "" ||
        person.nom.toLowerCase().includes(q) ||
        person.prenom.toLowerCase().includes(q) ||
        person.ville.toLowerCase().includes(q);

      if (matchesRole && matchesSearch) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else {
        if (map.hasLayer(marker)) marker.removeFrom(map);
      }
    });
  }, [activeRoles, searchQuery]);

  // Fly to selected person
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedPerson) return;
    map.flyTo([selectedPerson.lat, selectedPerson.lng], 12, { duration: 1 });
  }, [selectedPerson]);

  // Place / update the wifi-down signal marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous signal marker
    if (signalMarkerRef.current) {
      signalMarkerRef.current.removeFrom(map);
      signalMarkerRef.current = null;
    }

    if (!signalPoint) return;

    const wifiIcon = L.divIcon({
      className: "",
      html: `
        <div class="wifi-down-marker">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <circle cx="12" cy="20" r="1" fill="currentColor"/>
          </svg>
        </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });

    const marker = L.marker([signalPoint.lat, signalPoint.lng], { icon: wifiIcon })
      .addTo(map)
      .bindPopup(
        `<div style="font-size:12px;line-height:1.4;">
          <strong style="color:#ef4444;">WiFi hors service</strong><br/>
          <span style="color:#94a3b8;font-size:11px;">${signalPoint.label}</span>
        </div>`,
        { maxWidth: 240 }
      )
      .openPopup();

    signalMarkerRef.current = marker;
    map.flyTo([signalPoint.lat, signalPoint.lng], 14, { duration: 1.2 });
  }, [signalPoint]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: clickModeActive ? "crosshair" : undefined }}
    />
  );
}
