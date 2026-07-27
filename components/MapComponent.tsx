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
    // Gyrophare bleu — astreinte
    badge = `<span style="position:absolute;top:-6px;right:-6px;width:14px;height:14px;border-radius:50%;background:#1d4ed8;border:2px solid #111827;display:flex;align-items:center;justify-content:center;"><svg viewBox='0 0 24 24' width='8' height='8' fill='white' stroke='white' stroke-width='1'><path d='M12 3a5 5 0 0 1 5 5c0 2.5-1.5 4-2.5 6h-5C8.5 12 7 10.5 7 8a5 5 0 0 1 5-5z'/><rect x='9.5' y='14' width='5' height='1.5' rx='0.5'/><rect x='10' y='15.5' width='4' height='1.5' rx='0.5'/></svg></span>`;
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

// Department codes per zone highlighted on the map.
// NAQ: 40 (Landes), 47 (Lot-et-Garonne) and 64 (Pyrénées-Atlantiques) excluded
// from fill — their shared borders trace naturally from included depts.
const ZONE_DEPTS: Record<string, Set<string>> = {
  // Nouvelle-Aquitaine
  NAQ:  new Set(["16", "17", "19", "23", "24", "33", "79", "86", "87"]),
  // Hauts-de-France
  HDF:  new Set(["02", "59", "60", "62", "80"]),
  // Normandie - Centre Val de Loire
  NVL:  new Set(["14", "18", "27", "28", "36", "41", "45", "50", "61", "76"]),
  // Bretagne - Pays de la Loire
  BPL:  new Set(["22", "29", "35", "37", "44", "49", "53", "56", "72", "85"]),
  // Pyrénées
  PYR:  new Set(["09", "31", "32", "40", "46", "47", "64", "65", "81", "82"]),
  // Occitanie
  OCC:  new Set(["11", "12", "30", "34", "48", "66", "84"]),
  // Provence - Alpes - Côte d'Azur - Corse (2A/2B pour la Corse, pas "20")
  PACA: new Set(["04", "05", "06", "13", "2A", "2B", "83"]),
  // Auvergne - Rhône-Alpes
  ARA:  new Set(["03", "07", "15", "26", "38", "42", "43", "63", "69"]),
  // Bourgogne - Franche-Comté (inclut 01 Ain, 73 Savoie, 74 Haute-Savoie)
  BFC:  new Set(["01", "21", "25", "39", "58", "70", "71", "73", "74", "89", "90"]),
  // Grand Est (08 Ardennes retiré — appartient à HDF)
  GES:  new Set(["10", "51", "52", "54", "55", "57", "67", "68", "88"]),
  // Île-de-France Est
  IDFE: new Set(["75", "77", "91", "94"]),
  // Île-de-France Ouest
  IDFO: new Set(["78", "92", "93", "95"]),
};
// Fallback
const NOUVELLE_AQUITAINE_DEPTS = ZONE_DEPTS.NAQ;

/** Initial map center [lat, lng] and zoom level per zone */
const ZONE_VIEW: Record<string, { center: [number, number]; zoom: number }> = {
  ALL:  { center: [46.8, 2.3],    zoom: 6 },
  NAQ:  { center: [45.4, 0.5],    zoom: 7 },
  HDF:  { center: [50.2, 2.8],    zoom: 8 },
  NVL:  { center: [48.5, 0.8],    zoom: 7 },
  BPL:  { center: [47.6, -1.8],   zoom: 7 },
  PYR:  { center: [43.5, 0.2],    zoom: 7 },
  OCC:  { center: [43.8, 2.8],    zoom: 7 },
  PACA: { center: [43.8, 6.0],    zoom: 7 },
  ARA:  { center: [45.3, 4.8],    zoom: 7 },
  BFC:  { center: [47.0, 4.8],    zoom: 7 },
  GES:  { center: [48.5, 6.5],    zoom: 7 },
  IDFE: { center: [48.7, 2.7],    zoom: 9 },
  IDFO: { center: [48.8, 2.1],    zoom: 9 },
};

interface MapComponentProps {
  /** Active people list — from usePeople() hook in parent */
  people?: Person[];
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
  /** When true, only on-call people are shown on the map */
  onlyOnCall?: boolean;
  /** Zone identifier — drives which department boundaries are highlighted */
  zoneId?: string;
}

export default function MapComponent({
  people: peopleProp,
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
  onlyOnCall = false,
  zoneId = "NAQ",
}: MapComponentProps) {
  // Use provided people list, fall back to the static constant
  const people = peopleProp ?? PEOPLE;

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

    const view = ZONE_VIEW[zoneId] ?? { center: [46.5, 2.3] as [number, number], zoom: 6 };
    const map = L.map(containerRef.current, {
      center: view.center,
      zoom: view.zoom,
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

        // ── Layers 2+3: zone fill + outline ───────────────────────────────
        const ZONE_COLOURS: Record<string, string> = {
          NAQ: "#38bdf8", HDF: "#22c55e", NVL: "#f59e0b", BPL: "#f97316",
          PYR: "#eab308", OCC: "#a3e635", PACA: "#f472b6", ARA: "#fb923c",
          BFC: "#818cf8", GES: "#34d399", IDFE: "#e879f9", IDFO: "#60a5fa",
        };

        if (zoneId === "ALL") {
          // Render every zone with its own colour
          Object.entries(ZONE_DEPTS).forEach(([id, depts]) => {
            const colour = ZONE_COLOURS[id] ?? "#7c3aed";
            const features = (geojson.features ?? []).filter(
              (f: { properties: { code: string } }) => depts.has(f.properties.code)
            );
            if (!features.length || !mapRef.current) return;
            const fillLayer = L.geoJSON(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { type: "FeatureCollection", features } as any,
              { style: { color: colour, weight: 2, opacity: 0.9, fillColor: colour, fillOpacity: 0.1, interactive: false } }
            );
            fillLayer.addTo(mapRef.current);
            geoLayersRef.current.push(fillLayer);
            const outline = L.geoJSON(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { type: "FeatureCollection", features } as any,
              { style: { color: colour, weight: 3, opacity: 1, fillOpacity: 0, interactive: false } }
            );
            outline.addTo(mapRef.current);
            geoLayersRef.current.push(outline);
          });
        } else {
          // Single zone
          const zoneDepts = ZONE_DEPTS[zoneId] ?? NOUVELLE_AQUITAINE_DEPTS;
          const naFeatures: unknown[] = (geojson.features ?? []).filter(
            (f: { properties: { code: string } }) => zoneDepts.has(f.properties.code)
          );
          if (naFeatures.length > 0) {
            const naFillLayer = L.geoJSON(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { type: "FeatureCollection", features: naFeatures } as any,
              { style: { color: "#4b6cb7", weight: 2, opacity: 0.9, fillColor: "#4b6cb7", fillOpacity: 0.08, interactive: false } }
            );
            naFillLayer.addTo(mapRef.current);
            geoLayersRef.current.push(naFillLayer);
            const regionOutline = L.geoJSON(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { type: "FeatureCollection", features: naFeatures } as any,
              { style: { color: "#7c3aed", weight: 4, opacity: 1, fillOpacity: 0, interactive: false } }
            );
            regionOutline.addTo(mapRef.current);
            geoLayersRef.current.push(regionOutline);
          }
        }
      })
      .catch(() => {
        // Map still works without boundaries
      });

    // Create markers for all people (initial render — no on-call highlight yet)
    people.forEach((person) => {
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

  // Sync markers when people list changes (add/remove resources)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove markers for people no longer in the list
    markersRef.current.forEach((marker, person) => {
      if (!people.includes(person)) {
        marker.removeFrom(map);
        markersRef.current.delete(person);
      }
    });

    // Add markers for newly added people
    people.forEach((person) => {
      if (!markersRef.current.has(person)) {
        const isHoliday = false;
        const isOnCall = onCallNoms.has(person.nom);
        const icon = buildPersonIcon(person, isOnCall, false, isHoliday);
        const marker = L.marker([person.lat, person.lng], { icon })
          .addTo(map)
          .on("click", () => onPersonSelect(person));
        markersRef.current.set(person, marker);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people]);

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

    people.forEach((person) => {
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

      // When "astreintes uniquement" is active, only on-call people are shown
      const passesOnlyOnCall = !onlyOnCall || isOnCall;

      if (matchesRole && matchesSearch && passesOnlyOnCall) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else {
        if (map.hasLayer(marker)) marker.removeFrom(map);
      }
    });
  }, [people, activeRoles, searchQuery, onCallNoms, routeResultPersons, onlyOnCall]);

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

      // Format createdAt as "DD/MM/YYYY à HH:MM"
      const createdAtStr = incident.createdAt
        ? (() => {
            const d = new Date(incident.createdAt);
            const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
            const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            return `${date} à ${time}`;
          })()
        : null;

      const addedByStr = incident.addedBy ?? null;

      const metaLine = [
        addedByStr ? `<span style="color:#f8fafc;">Par&nbsp;: <strong>${addedByStr}</strong></span>` : null,
        createdAtStr ? `<span style="color:#94a3b8;">Le&nbsp;${createdAtStr}</span>` : null,
      ]
        .filter(Boolean)
        .join("<br/>");

      const marker = L.marker([incident.lat, incident.lng], { icon, zIndexOffset: 2000 })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:180px;">
             <div style="font-size:12px;font-weight:700;color:#ef4444;margin-bottom:6px;display:flex;align-items:center;gap:5px;">
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
               Panne r&eacute;seau signal&eacute;e
             </div>
             <div style="font-size:11px;color:#94a3b8;margin-bottom:${metaLine ? "8px" : "0"};">${shortLabel}</div>
             ${metaLine ? `<div style="font-size:11px;line-height:1.7;border-top:1px solid rgba(148,163,184,0.2);padding-top:6px;">${metaLine}</div>` : ""}
           </div>`,
          { maxWidth: 260 }
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
