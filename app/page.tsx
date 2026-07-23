"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import PersonCard from "@/components/PersonCard";
import RouteResults from "@/components/RouteResults";
import { type Person, type Role } from "@/lib/people";
import AddressSearch, { type NetworkIncident } from "@/components/AddressSearch";
import { getOnCallNoms } from "@/lib/schedule";
import { computeRouteResults, type RouteResult } from "@/lib/routing";
import {
  getIncidents,
  addIncident,
  removeIncident,
  getPersonStatuses,
  upsertPersonStatus,
} from "@/app/actions/shared-state";
import NotificationBanner from "@/components/NotificationBanner";
import EffectifsModal from "@/components/EffectifsModal";
import UpdateReminderBanner from "@/components/UpdateReminderBanner";
import {
  sendNotification,
  buildIncidentNotifBody,
} from "@/lib/notifications";
import { PEOPLE } from "@/lib/people";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a2535" }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
        />
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Chargement de la carte…
        </p>
      </div>
    </div>
  ),
});

const ALL_ROLES: Role[] = ["CIR", "REF", "TMF", "TMRa", "TMRe"];
const POLL_INTERVAL_MS = 5000;

export default function Home() {
  const [activeRoles, setActiveRoles] = useState<Set<Role>>(new Set(ALL_ROLES));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [incidents, setIncidents] = useState<NetworkIncident[]>([]);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [effectifsModalOpen, setEffectifsModalOpen] = useState(false);
  // When true: show only on-call people (in the sidebar list, the modal, and on the map)
  const [onlyOnCall, setOnlyOnCall] = useState(false);
  const handleToggleOnlyOnCall = useCallback(() => setOnlyOnCall((v) => !v), []);

  // On-call: seeded from the daily schedule, overrideable via DB
  const [onCallNoms, setOnCallNoms] = useState<Set<string>>(() => getOnCallNoms(new Date()));
  // Holiday flags — persist in DB
  const [holidayNoms, setHolidayNoms] = useState<Set<string>>(new Set());

  // Track local incident IDs to avoid re-adding incidents we placed ourselves
  const localIncidentIdsRef = useRef<Set<string>>(new Set());

  // ── Initial load + polling ─────────────────────────────────────────────
  const syncFromDB = useCallback(async () => {
    try {
      const [dbIncidents, dbStatuses] = await Promise.all([
        getIncidents(),
        getPersonStatuses(),
      ]);

      // Merge DB incidents — add any we don't have locally yet
      setIncidents((prev) => {
        const prevIds = new Set(prev.map((i) => i.id));
        const toAdd = dbIncidents
          .filter((d) => !prevIds.has(d.id))
          .map((d) => ({ id: d.id, label: d.label, lat: d.lat, lng: d.lng }));

        // Fire a notification for remote incidents (placed by other users)
        toAdd
          .filter((inc) => !localIncidentIdsRef.current.has(inc.id))
          .forEach((inc) => {
            const { title, body } = buildIncidentNotifBody({
              label: inc.label,
              onCallNames: [],
              proximityNames: [],
            });
            sendNotification(title, {
              body: "Panne signalée par un autre utilisateur. Ouvrez la carte pour les détails.",
              tag: inc.id,
            });
          });

        // Remove any that were deleted by another user
        const dbIds = new Set(dbIncidents.map((d) => d.id));
        const kept = prev.filter((p) => dbIds.has(p.id));
        return toAdd.length > 0 || kept.length !== prev.length
          ? [...kept, ...toAdd]
          : prev;
      });

      // Rebuild on-call and holiday sets from DB overrides
      const baseOnCall = getOnCallNoms(new Date());
      const nextOnCall = new Set(baseOnCall);
      const nextHoliday = new Set<string>();

      for (const s of dbStatuses) {
        if (s.isHoliday) {
          nextHoliday.add(s.nom);
          nextOnCall.delete(s.nom); // holiday overrides on-call
        } else if (s.isOnCall) {
          nextOnCall.add(s.nom);
        } else {
          // Explicitly set to false — remove from base on-call if present
          nextOnCall.delete(s.nom);
        }
      }

      setOnCallNoms(nextOnCall);
      setHolidayNoms(nextHoliday);
    } catch {
      // Silently fail — map still works offline
    }
  }, []);

  useEffect(() => {
    syncFromDB();
    const interval = setInterval(syncFromDB, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [syncFromDB]);

  // Auto-refresh on-call seed at midnight
  useEffect(() => {
    function scheduleRefresh() {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      return setTimeout(() => {
        syncFromDB();
        scheduleRefresh();
      }, msUntilMidnight);
    }
    const t = scheduleRefresh();
    return () => clearTimeout(t);
  }, [syncFromDB]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleToggleOnCall = useCallback(async (nom: string) => {
    setOnCallNoms((prev) => {
      const next = new Set(prev);
      const nowOnCall = !prev.has(nom);
      if (nowOnCall) next.add(nom); else next.delete(nom);
      upsertPersonStatus(nom, { isOnCall: nowOnCall }).catch(() => {});
      return next;
    });
  }, []);

  const handleToggleHoliday = useCallback(async (nom: string) => {
    setHolidayNoms((prev) => {
      const next = new Set(prev);
      const nowHoliday = !prev.has(nom);
      if (nowHoliday) {
        next.add(nom);
        setOnCallNoms((prevOC) => {
          const nextOC = new Set(prevOC);
          nextOC.delete(nom);
          return nextOC;
        });
        upsertPersonStatus(nom, { isHoliday: true, isOnCall: false }).catch(() => {});
      } else {
        next.delete(nom);
        upsertPersonStatus(nom, { isHoliday: false }).catch(() => {});
      }
      return next;
    });
  }, []);

  const handleToggleRole = useCallback((role: Role) => {
    setActiveRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
  }, []);

  const handlePersonSelect = useCallback((person: Person | null) => {
    setSelectedPerson(person);
  }, []);

  // Routing results panel
  const [activeRouteIncident, setActiveRouteIncident] = useState<NetworkIncident | null>(null);
  const [routeResults, setRouteResults] = useState<RouteResult[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const handleAddIncident = useCallback(
    async (incident: NetworkIncident) => {
      localIncidentIdsRef.current.add(incident.id);
      setIncidents((prev) => [...prev, incident]);
      setActiveRouteIncident(incident);
      setRouteResults([]);
      setRouteLoading(true);

      // Persist to DB for all users
      addIncident(incident).catch(() => {});

      try {
        const results = await computeRouteResults(
          incident.lat,
          incident.lng,
          onCallNoms,
          holidayNoms
        );
        setRouteResults(results);

        // --- Notification ---
        // Target: on-call + CIR + REF + proximity (≤1h)
        const onCallNames = PEOPLE
          .filter((p) => onCallNoms.has(p.nom))
          .map((p) => `${p.prenom} ${p.nom}`);
        const proximityNames = results
          .filter((r) => !r.isOnCall)
          .map((r) => `${r.person.prenom} ${r.person.nom}`);
        const { title, body } = buildIncidentNotifBody({
          label: incident.label,
          onCallNames,
          proximityNames,
        });
        sendNotification(title, { body, tag: incident.id });
      } finally {
        setRouteLoading(false);
      }
    },
    [onCallNoms, holidayNoms]
  );

  // Click-to-place mode — declared AFTER handleAddIncident to satisfy TS forward-ref rules
  const [clickToPlaceMode, setClickToPlaceMode] = useState(false);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setClickToPlaceMode(false);
      let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          { headers: { "Accept-Language": "fr" }, signal: controller.signal }
        );
        clearTimeout(timeout);
        if (r.ok) {
          const data = await r.json();
          label = data.display_name ?? label;
        }
      } catch { /* keep coordinate label on error or timeout */ }

      await handleAddIncident({
        id: `map-click-${Date.now()}`,
        label,
        lat,
        lng,
      });
    },
    [handleAddIncident]
  );

  // Open the RouteResults panel when clicking an existing incident marker
  const handleIncidentClick = useCallback(
    async (incident: NetworkIncident) => {
      // If already showing this incident's results, do nothing
      if (activeRouteIncident?.id === incident.id && !routeLoading) return;

      setActiveRouteIncident(incident);
      setRouteResults([]);
      setRouteLoading(true);
      try {
        const results = await computeRouteResults(
          incident.lat,
          incident.lng,
          onCallNoms,
          holidayNoms
        );
        setRouteResults(results);
      } finally {
        setRouteLoading(false);
      }
    },
    [activeRouteIncident, routeLoading, onCallNoms, holidayNoms]
  );

  const handleRemoveIncident = useCallback(
    (id: string) => {
      setIncidents((prev) => prev.filter((inc) => inc.id !== id));
      removeIncident(id).catch(() => {});
      if (activeRouteIncident?.id === id) {
        setActiveRouteIncident(null);
        setRouteResults([]);
      }
    },
    [activeRouteIncident]
  );

  return (
    <>
    <UpdateReminderBanner />
    <NotificationBanner />
    <main className="flex w-full overflow-hidden" style={{ height: "100dvh" }}>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar
          activeRoles={activeRoles}
          onToggleRole={handleToggleRole}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onPersonSelect={handlePersonSelect}
          selectedPerson={selectedPerson}
          incidents={incidents}
          onAddIncident={handleAddIncident}
          onRemoveIncident={handleRemoveIncident}
          onCallNoms={onCallNoms}
          holidayNoms={holidayNoms}
          onToggleOnCall={handleToggleOnCall}
          onToggleHoliday={handleToggleHoliday}
          hidePersonList
          onOpenEffectifs={() => setEffectifsModalOpen(true)}
          onlyOnCall={onlyOnCall}
          onToggleOnlyOnCall={handleToggleOnlyOnCall}
        />
      </div>

      {/* Map */}
      <div className="relative flex-1 h-full">
        <MapComponent
          activeRoles={activeRoles}
          searchQuery={searchQuery}
          onPersonSelect={handlePersonSelect}
          selectedPerson={selectedPerson}
          incidents={incidents}
          onCallNoms={onCallNoms}
          routeResultPersons={new Set(routeResults.filter((r) => !r.isOnCall).map((r) => r.person.nom))}
          holidayNoms={holidayNoms}
          clickToPlaceMode={clickToPlaceMode}
          onMapClick={handleMapClick}
          onIncidentClick={handleIncidentClick}
          onlyOnCall={onlyOnCall}
        />

        {/* Signaler une panne button — opens choice modal */}
        {!clickToPlaceMode ? (
          <button
            onClick={() => setIncidentModalOpen(true)}
            className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
            Signaler une panne
          </button>
        ) : (
          /* Cancel button when click-to-place mode is active */
          <button
            onClick={() => setClickToPlaceMode(false)}
            className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95"
            style={{
              background: "#ef4444",
              border: "1px solid #ef4444",
              color: "#fff",
              boxShadow: "0 0 0 3px rgba(239,68,68,0.3)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Annuler
          </button>
        )}

        {/* Crosshair hint overlay when click-to-place is active */}
        {clickToPlaceMode && (
          <div className="absolute inset-x-0 top-14 z-[999] flex justify-center pointer-events-none">
            <div
              className="px-4 py-2 rounded-full text-xs font-medium shadow-xl"
              style={{ background: "rgba(239,68,68,0.92)", color: "#fff", backdropFilter: "blur(4px)" }}
            >
              Cliquez sur la carte pour marquer la panne
            </div>
          </div>
        )}

        {/* Incident choice modal */}
        {incidentModalOpen && (
          <div
            className="absolute inset-0 z-[1800] flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setIncidentModalOpen(false); }}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="relative z-10 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                width: "min(340px, calc(100vw - 2rem))",
              }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Signaler une panne
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    Choisissez votre méthode de localisation
                  </p>
                </div>
                <button
                  onClick={() => setIncidentModalOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Option 1 — click on map */}
              <button
                onClick={() => { setIncidentModalOpen(false); setClickToPlaceMode(true); }}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all hover:bg-white/5 active:scale-[0.98]"
                style={{ border: "1px solid var(--color-border)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    Cliquer sur la carte
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    Placez directement le repère sur la zone concernée
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              {/* Option 2 — address search (inline) */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold px-1" style={{ color: "var(--color-text-secondary)" }}>
                  Ou saisir une adresse
                </p>
                {/* Inline AddressSearch */}
                <IncidentAddressSearch
                  onAddIncident={(incident) => {
                    setIncidentModalOpen(false);
                    handleAddIncident(incident);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {selectedPerson && (
          <PersonCard
            person={selectedPerson}
            onClose={() => setSelectedPerson(null)}
            isOnCall={onCallNoms.has(selectedPerson.nom)}
          />
        )}

        {activeRouteIncident && (
          <RouteResults
            incident={activeRouteIncident}
            results={routeResults}
            loading={routeLoading}
            onClose={() => {
              setActiveRouteIncident(null);
              setRouteResults([]);
            }}
          />
        )}

        {/* Mobile FABs */}
        <div
          className="md:hidden absolute left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Filters / Signalement sheet */}
          <button
            className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all active:scale-95"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
            onClick={() => setMobileSheetOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Filtres
          </button>
          {/* Effectifs modal */}
          <button
            className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all active:scale-95"
            style={{
              background: "var(--color-accent)",
              color: "#fff",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
            onClick={() => setEffectifsModalOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Effectifs
          </button>
        </div>
      </div>

      {/* Mobile bottom-sheet */}
      {mobileSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[2000] flex flex-col justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setMobileSheetOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative flex flex-col rounded-t-2xl overflow-hidden"
            style={{
              background: "var(--color-surface)",
              height: "90dvh",
              maxHeight: "90dvh",
              border: "1px solid var(--color-border)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div className="flex-1 flex justify-center">
                <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-border)" }} />
              </div>
              <button
                onClick={() => setMobileSheetOpen(false)}
                className="absolute right-4 rounded-lg p-1.5 transition-colors hover:bg-white/10"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                activeRoles={activeRoles}
                onToggleRole={handleToggleRole}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                onPersonSelect={(person) => {
                  handlePersonSelect(person);
                  setMobileSheetOpen(false);
                }}
                selectedPerson={selectedPerson}
                incidents={incidents}
                onAddIncident={handleAddIncident}
                onRemoveIncident={handleRemoveIncident}
                onCallNoms={onCallNoms}
                holidayNoms={holidayNoms}
                onToggleOnCall={handleToggleOnCall}
                onToggleHoliday={handleToggleHoliday}
                mobileSheet
                hidePersonList
                onOpenEffectifs={() => {
                  setMobileSheetOpen(false);
                  setEffectifsModalOpen(true);
                }}
                onlyOnCall={onlyOnCall}
                onToggleOnlyOnCall={handleToggleOnlyOnCall}
              />
            </div>
          </div>
        </div>
      )}
      {/* Effectifs modal — dedicated, list only */}
      <EffectifsModal
        open={effectifsModalOpen}
        onClose={() => setEffectifsModalOpen(false)}
        onPersonSelect={(person) => {
          handlePersonSelect(person);
          setEffectifsModalOpen(false);
        }}
        onCallNoms={onCallNoms}
        holidayNoms={holidayNoms}
        onToggleOnCall={handleToggleOnCall}
        onToggleHoliday={handleToggleHoliday}
        onlyOnCall={onlyOnCall}
        onToggleOnlyOnCall={handleToggleOnlyOnCall}
      />

    </main>
    </>
  );
}

/** Thin wrapper so AddressSearch can call onAddIncident directly inside the modal */
function IncidentAddressSearch({ onAddIncident }: { onAddIncident: (i: NetworkIncident) => void }) {
  return <AddressSearch onAddIncident={onAddIncident} />;
}
