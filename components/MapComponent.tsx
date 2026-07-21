"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { PEOPLE, ROLE_COLORS, ROLE_LABELS, type Person, type Role } from "@/lib/people";
import type { NetworkIncident } from "@/components/AddressSearch";

interface MapComponentProps {
  activeRoles: Set<Role>;
  searchQuery: string;
  onPersonSelect: (person: Person | null) => void;
  selectedPerson: Person | null;
  incidents: NetworkIncident[];
}

export default function MapComponent({
  activeRoles,
  searchQuery,
  onPersonSelect,
  selectedPerson,
  incidents,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<Person, L.Marker>>(new Map());
  const incidentMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Sync incident markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existingIds = new Set(incidentMarkersRef.current.keys());

    incidents.forEach((incident) => {
      if (incidentMarkersRef.current.has(incident.id)) return;

      const wifiOffSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>`;

      const icon = L.divIcon({
        className: "",
        html: `<div class="incident-marker">${wifiOffSvg}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -24],
      });

      const shortLabel = incident.label.split(",").slice(0, 2).join(",");

      const marker = L.marker([incident.lat, incident.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-size:12px;font-weight:600;color:#ef4444;margin-bottom:4px;">Panne réseau signalée</div>
           <div style="font-size:11px;color:#94a3b8;">${shortLabel}</div>`,
          { maxWidth: 240 }
        );

      incidentMarkersRef.current.set(incident.id, marker);
      existingIds.delete(incident.id);

      // Fly to new incident
      map.flyTo([incident.lat, incident.lng], 14, { duration: 1 });
    });

    // Remove markers that are no longer in incidents list
    existingIds.forEach((id) => {
      const marker = incidentMarkersRef.current.get(id);
      if (marker) {
        marker.removeFrom(map);
        incidentMarkersRef.current.delete(id);
      }
    });
  }, [incidents]);

  return <div ref={containerRef} className="w-full h-full" />;
}
