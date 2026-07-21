"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { PEOPLE, ROLE_COLORS, ROLE_LABELS, type Person, type Role } from "@/lib/people";

interface MapComponentProps {
  activeRoles: Set<Role>;
  searchQuery: string;
  onPersonSelect: (person: Person | null) => void;
  selectedPerson: Person | null;
}

export default function MapComponent({
  activeRoles,
  searchQuery,
  onPersonSelect,
  selectedPerson,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<Person, L.Marker>>(new Map());
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

  return <div ref={containerRef} className="w-full h-full" />;
}
