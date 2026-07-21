"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import PersonCard from "@/components/PersonCard";
import { type Person, type Role } from "@/lib/people";
import { type NetworkIncident } from "@/components/AddressSearch";
import { getOnCallNoms } from "@/lib/schedule";

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

export default function Home() {
  const [activeRoles, setActiveRoles] = useState<Set<Role>>(new Set(ALL_ROLES));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [incidents, setIncidents] = useState<NetworkIncident[]>([]);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // On-call schedule — refreshed at midnight automatically
  const [onCallNoms, setOnCallNoms] = useState<Set<string>>(() => getOnCallNoms(new Date()));

  useEffect(() => {
    // Compute ms until next midnight, then refresh the on-call set
    function scheduleRefresh() {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      return setTimeout(() => {
        setOnCallNoms(getOnCallNoms(new Date()));
        scheduleRefresh();
      }, msUntilMidnight);
    }
    const t = scheduleRefresh();
    return () => clearTimeout(t);
  }, []);

  const handleToggleRole = useCallback((role: Role) => {
    setActiveRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }, []);

  const handlePersonSelect = useCallback((person: Person | null) => {
    setSelectedPerson(person);
  }, []);

  const handleAddIncident = useCallback((incident: NetworkIncident) => {
    setIncidents((prev) => [...prev, incident]);
  }, []);

  const handleRemoveIncident = useCallback((id: string) => {
    setIncidents((prev) => prev.filter((inc) => inc.id !== id));
  }, []);

  return (
    /* 100dvh = dynamic viewport height: shrinks when the browser chrome appears on mobile */
    <main className="flex w-full overflow-hidden" style={{ height: "100dvh" }}>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
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
        />
      </div>

      {/* ── Map (full screen on mobile) ── */}
      <div className="relative flex-1 h-full">
        <MapComponent
          activeRoles={activeRoles}
          searchQuery={searchQuery}
          onPersonSelect={handlePersonSelect}
          selectedPerson={selectedPerson}
          incidents={incidents}
          onCallNoms={onCallNoms}
        />

        {selectedPerson && (
          <PersonCard
            person={selectedPerson}
            onClose={() => setSelectedPerson(null)}
          />
        )}

        {/* ── Mobile FAB — positioned above safe-area (home indicator / nav bar) ── */}
        <button
          className="md:hidden absolute left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all active:scale-95"
          style={{
            bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
            background: "var(--color-accent)",
            color: "#fff",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
          onClick={() => setMobileSheetOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          Équipes &amp; filtres
        </button>
      </div>

      {/* ── Mobile bottom-sheet overlay ── */}
      {mobileSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[2000] flex flex-col justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setMobileSheetOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet — paddingBottom ensures content clears the OS navigation bar */}
          <div
            className="relative flex flex-col rounded-t-2xl overflow-hidden"
            style={{
              background: "var(--color-surface)",
              maxHeight: "85dvh",
              border: "1px solid var(--color-border)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Drag handle + close button */}
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

            {/* Sidebar content inside the sheet */}
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
                mobileSheet
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
