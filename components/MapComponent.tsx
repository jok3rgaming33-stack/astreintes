"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { FeatureCollection } from "geojson";
import { PEOPLE, ROLE_COLORS, ROLE_LABELS, type Person, type Role } from "@/lib/people";
import type { NetworkIncident } from "@/components/AddressSearch";

// Department codes for Nouvelle-Aquitaine region
const NOUVELLE_AQUITAINE_DEPTS = new Set([
  "16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87",
]);

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
  const geoLayersRef = useRef<L.Layer[]>([]);

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

    // Load department GeoJSON and draw boundaries
    fetch(
      "https://france-geojson.gregoiredavid.fr/repo/departements.geojson"
    )
      .then((r) => r.json())
      .then((geojson) => {
        if (!mapRef.current) return;

        // Draw individual department boundaries (thin blue)
        const deptLayer = L.geoJSON(geojson, {
          style: (feature) => {
            const code: string = feature?.properties?.code ?? "";
            const isNA = NOUVELLE_AQUITAINE_DEPTS.has(code);
            return {
              color: isNA ? "#5b5fc7" : "#6b7280",
              weight: isNA ? 1.5 : 0.8,
              opacity: isNA ? 0.9 : 0.4,
              fillColor: isNA ? "#5b5fc7" : "transparent",
              fillOpacity: isNA ? 0.04 : 0,
              interactive: false,
            };
          },
        });
        deptLayer.addTo(mapRef.current);
        geoLayersRef.current.push(deptLayer);

        // Build a merged polygon for Nouvelle-Aquitaine region outline (thick border)
        const naFeatures = geojson.features.filter(
          (f: { properties: { code: string } }) =>
            NOUVELLE_AQUITAINE_DEPTS.has(f.properties.code)
        );
        if (naFeatures.length > 0) {
          const regionLayer = L.geoJSON(
            { type: "FeatureCollection", features: naFeatures } as FeatureCollection,
            {
              style: {
                color: "#7c3aed",
                weight: 3,
                opacity: 1,
                fillOpacity: 0,
                interactive: false,
                dashArray: undefined,
              },
            }
          );
          regionLayer.addTo(mapRef.current);
          geoLayersRef.current.push(regionLayer);
        }
      })
      .catch(() => {
        // GeoJSON unavailable — map still works without boundaries
      });

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
      incidentMarkersRef.current.clear();
      geoLayersRef.current = [];
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

  // Sync incident markers — add new ones, remove deleted ones
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(incidents.map((i) => i.id));

    // Remove markers that were deleted
    incidentMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.removeFrom(map);
        incidentMarkersRef.current.delete(id);
      }
    });

    // Add new markers
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

      // Fly to new incident
      map.flyTo([incident.lat, incident.lng], 14, { duration: 1 });
    });
  }, [incidents]);

  return <div ref={containerRef} className="w-full h-full" />;
}
