"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PersonCard from "@/components/PersonCard";
import { type Person, type Role } from "@/lib/people";
import { type NetworkIncident } from "@/components/AddressSearch";

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

  const handleToggleRole = useCallback((role: Role) => {
    setActiveRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }, []);

  const handlePersonSelect = useCallback((person: Person | null) => {
    setSelectedPerson(person);
  }, []);

  const handleAddIncident = useCallback((incident: NetworkIncident) => {
    setIncidents((prev) => [...prev, incident]);
  }, []);

  return (
    <main className="flex h-screen w-full overflow-hidden">
      <Sidebar
        activeRoles={activeRoles}
        onToggleRole={handleToggleRole}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onPersonSelect={handlePersonSelect}
        selectedPerson={selectedPerson}
        incidents={incidents}
        onAddIncident={handleAddIncident}
      />
      <div className="relative flex-1 h-full">
        <MapComponent
          activeRoles={activeRoles}
          searchQuery={searchQuery}
          onPersonSelect={handlePersonSelect}
          selectedPerson={selectedPerson}
          incidents={incidents}
        />
        {selectedPerson && (
          <PersonCard
            person={selectedPerson}
            onClose={() => setSelectedPerson(null)}
          />
        )}
      </div>
    </main>
  );
}
