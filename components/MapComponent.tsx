"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

import { PEOPLE, ROLE_COLORS, type Person, type Role } from "@/lib/people";
import { getOnCallNoms } from "@/lib/schedule";
import type { NetworkIncident } from "@/components/AddressSearch";

/**
 * Build a Leaflet divIcon for a person marker.
 * - On holiday: grey + palm-tree badge, reduced opacity
 * - On-call:    gold ring (#f59e0b) + ! badge
 * - Proximity:  cyan ring (#06b6d4) + clock badge
 * - Normal:     role colour, no ring
 */
function buildPersonIcon(
  person: Person,
  isOnCall: boolean,
  isProximity = false,
  isHoliday = false
): L.DivIcon {
  // 1 letter of first name + first 2 letters of last name
  const initials = `${person.prenom[0]}${person.nom.slice(0, 2)}`.toUpperCase();
  const color = isHoliday ? "#6b7280" : ROLE_COLORS[person.role];

  let ring = "";
  let badge = "";
  let extra = "";

  if (isHoliday) {
    extra = "opacity:0.45;";
    badge = `<span style="position:absolute;top:-5px;right:-5px;width:13px;height:13px;border-radius:50%;background:#374151;border:2px solid #111827;display:flex;align-items:center;justify-content:center;font-size:8px;line-height:1;">🌴</span>`;
  } else if (isOnCall) {
    // Yellow + pulsing — handled by CSS class, inline ring just for fallback
    ring = ``;
    badge = `<span style="position:absolute;top:-5px;right:-5px;width:12px;height:12px;border-radius:50%;background:#eab308;border:2px solid #111827;display:flex;align-items:center;justify-content:center;font-size:7px;color:#111827;font-weight:900;">!</span>`;
  } else if (isProximity) {
    ring = `box-shadow:0 0 0 3px #06b6d4,0 0 8px 3px rgba(6,182,212,0.45);`;
    badge = `<span style="position:absolute;top:-5px;right:-5px;width:12px;height:12px;border-radius:50%;background:#06b6d4;border:2px solid #111827;display:flex;align-items:center;justify-content:center;font-size:8px;color:#111827;font-weight:900;">⏱</span>`;
  }

  const onCallClass = isOnCall ? " person-marker-oncall" : "";
  return L.divIcon({
    className: "",
    html: `<div class="person-marker${onCallClass}" style="background-color:${color};position:relative;min-width:38px;${ring}${extra}">${initials}${badge}</div>`,
    iconSize: [38, 34],
    iconAnchor: [19, 17],
    popupAnchor: [0, -20],
  });
}

// Department codes for Nouvelle-Aquitaine region highlighted on the map.
// 40 (Landes), 47 (Lot-et-Garonne) and 64 (Pyrénées-Atlantiques) are excluded
// from the fill/outline highlight. Their shared borders with 33 and 24 remain
// visible because dept 33 and 24 are still in the set and their violet outline
// naturally traces the boundary line between them.
const NOUVELLE_AQUITAINE_DEPTS = new Set([
  "16", "17", "19", "23", "24", "33", "79", "86", "87",
]);

interface MapComponentProps {
  activeRoles: Set<Role>;
  searchQuery: string;
  onPersonSelect: (person: Person | null) => void;
  selectedPerson: Person | null;
  incidents: NetworkIncident[];
  onCallNoms: Set<string>;
  /** Persons from route-result calculation — shown with a cyan ring on the map */
  routeResultPersons?: Set<string>;
  /** Persons flagged as on holiday — shown greyed out on the map */
  holidayNoms?: Set<string>;
  /** When true, next map click places an incident marker */
  clickToPlaceMode?: boolean;
  /** Called with lat/lng when the user clicks the map in place mode */
  onMapClick?: (lat: number, lng: number) => void;
  /** Called when the user clicks an existing incident marker */
  onIncidentClick?: (incident: NetworkIncident) => void;
}

export default function MapComponent({
  activeRoles,
  searchQuery,
  onPersonSelect,
  selectedPerson,
  incidents,
  onCallNoms,
  routeResultPersons = new Set(),
  holidayNoms = new Set(),
  clickToPlaceMode = false,
  onMapClick,
  onIncidentClick,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<Person, L.Marker>>(new Map());
  const incidentMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const geoLayersRef = useRef<L.Layer[]>([]);
  // Keep latest callback in a ref so incident markers don't need to be recreated on prop change
  const onIncidentClickRef = useRef(onIncidentClick);
  useEffect(() => { onIncidentClickRef.current = onIncidentClick; }, [onIncidentClick]);

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

    // Load department GeoJSON from local public asset — no CORS, no external dep
    fetch("/departements.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((geojson) => {
        if (!mapRef.current) return;

        // ── Layer 1: thin blue outline on every department ──────────────────
        const deptLayer = L.geoJSON(geojson, {
          style: () => ({
            color: "#4b6cb7",
            weight: 1,
            opacity: 0.6,
            fillOpacity: 0,
            interactive: false,
          }),
        });
        deptLayer.addTo(mapRef.current);
        geoLayersRef.current.push(deptLayer);

        // ── Layer 2: light-blue fill + stronger blue border inside NA ───────
        const naFeatures: unknown[] = (geojson.features ?? []).filter(
          (f: { properties: { code: string } }) =>
            NOUVELLE_AQUITAINE_DEPTS.has(f.properties.code)
        );

        if (naFeatures.length > 0) {
          const naFillLayer = L.geoJSON(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: "FeatureCollection", features: naFeatures } as any,
            {
              style: {
                color: "#4b6cb7",
                weight: 2,
                opacity: 0.9,
                fillColor: "#4b6cb7",
                fillOpacity: 0.08,
                interactive: false,
              },
            }
          );
          naFillLayer.addTo(mapRef.current);
          geoLayersRef.current.push(naFillLayer);

          // ── Layer 3: thick violet outline on the outer edge of NA ─────────
          const regionOutline = L.geoJSON(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { type: "FeatureCollection", features: naFeatures } as any,
            {
              style: {
                color: "#7c3aed",
                weight: 4,
                opacity: 1,
                fillOpacity: 0,
                interactive: false,
              },
            }
          );
          regionOutline.addTo(mapRef.current);
          geoLayersRef.current.push(regionOutline);
        }
      })
      .catch(() => {
        // Map still works without boundaries
      });

    // Create markers for all people (initial render — no on-call highlight yet)
    PEOPLE.forEach((person) => {
      const icon = buildPersonIcon(person, false);
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

  // Refresh marker icons + z-order when on-call, proximity or holiday sets change
  useEffect(() => {
    markersRef.current.forEach((marker, person) => {
      const isHoliday = holidayNoms.has(person.nom);
      const isOnCall = !isHoliday && onCallNoms.has(person.nom);
      const isProximity = !isHoliday && !isOnCall && routeResultPersons.has(person.nom);
      marker.setIcon(buildPersonIcon(person, isOnCall, isProximity, isHoliday));
      // On-call on top (1000), proximity second (500), holiday at the back (-100), normal at 0
      const zOffset = isOnCall ? 1000 : isProximity ? 500 : isHoliday ? -100 : 0;
      marker.setZIndexOffset(zOffset);
    });
  }, [onCallNoms, routeResultPersons, holidayNoms]);

  // Update marker visibility based on active roles & search
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const q = searchQuery.toLowerCase();

    PEOPLE.forEach((person) => {
      const marker = markersRef.current.get(person);
      if (!marker) return;

      // On-call and proximity persons stay visible regardless of role filter
      const isOnCall = onCallNoms.has(person.nom);
      const isProximity = routeResultPersons.has(person.nom);
      const matchesRole = activeRoles.has(person.role) || isOnCall || isProximity;
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
  }, [activeRoles, searchQuery, onCallNoms, routeResultPersons]);

  // Toggle crosshair cursor and map click handler for place-incident mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const container = map.getContainer();
    container.style.cursor = clickToPlaceMode ? "crosshair" : "";

    if (!clickToPlaceMode || !onMapClick) return;

    const handler = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [clickToPlaceMode, onMapClick]);

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

      const marker = L.marker([incident.lat, incident.lng], { icon, zIndexOffset: 2000 })
        .addTo(map)
        .bindPopup(
          `<div style="font-size:12px;font-weight:600;color:#ef4444;margin-bottom:4px;">Panne réseau signalée</div>
           <div style="font-size:11px;color:#94a3b8;">${shortLabel}</div>`,
          { maxWidth: 240 }
        )
        .on("click", () => {
          onIncidentClickRef.current?.(incident);
        });

      incidentMarkersRef.current.set(incident.id, marker);

      // Fly to new incident
      map.flyTo([incident.lat, incident.lng], 14, { duration: 1 });
    });
  }, [incidents]);

  return <div ref={containerRef} className="w-full h-full" style={{ cursor: clickToPlaceMode ? "crosshair" : undefined }} />;
}
