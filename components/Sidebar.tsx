"use client";

import { useState, useMemo } from "react";
import { PEOPLE, ROLE_COLORS, ROLE_LABELS, type Person, type Role } from "@/lib/people";
import AddressSearch, { type NetworkIncident } from "@/components/AddressSearch";

const ALL_ROLES: Role[] = ["CIR", "REF", "TMF", "TMRa", "TMRe"];

interface SidebarProps {
  activeRoles: Set<Role>;
  onToggleRole: (role: Role) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  onPersonSelect: (person: Person) => void;
  selectedPerson: Person | null;
  incidents: NetworkIncident[];
  onAddIncident: (incident: NetworkIncident) => void;
  onRemoveIncident: (id: string) => void;
  /** When true, disables the collapse button and fills the parent width (used in mobile sheet) */
  mobileSheet?: boolean;
}

export default function Sidebar({
  activeRoles,
  onToggleRole,
  searchQuery,
  onSearch,
  onPersonSelect,
  selectedPerson,
  incidents,
  onAddIncident,
  onRemoveIncident,
  mobileSheet = false,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const filteredPeople = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return PEOPLE.filter((p) => {
      const matchesRole = activeRoles.has(p.role);
      const matchesSearch =
        q === "" ||
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        p.ville.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [activeRoles, searchQuery]);

  const countByRole = useMemo(() => {
    const counts: Partial<Record<Role, number>> = {};
    PEOPLE.forEach((p) => {
      counts[p.role] = (counts[p.role] ?? 0) + 1;
    });
    return counts;
  }, []);

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 overflow-hidden"
      style={{
        width: mobileSheet ? "100%" : collapsed ? "56px" : "320px",
        background: "var(--color-surface)",
        borderRight: mobileSheet ? "none" : "1px solid var(--color-border)",
        flexShrink: 0,
      }}
    >
      {/* Header — hide in mobileSheet (the sheet already has its own handle/close) */}
      {!mobileSheet && (
        <div
          className="flex items-center gap-3 px-4 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                Carte des équipes
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                {filteredPeople.length} / {PEOPLE.length} personnes
              </p>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-lg p-1.5 transition-colors hover:bg-white/10 flex-shrink-0"
            style={{ color: "var(--color-text-secondary)" }}
            title={collapsed ? "Agrandir" : "Réduire"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>
      )}

      {(!collapsed || mobileSheet) && (
        <>
          {/* Search */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-text-primary)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  background: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          </div>

          {/* Role filters */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Rôles
            </p>
            <div className="flex flex-col gap-1.5">
              {ALL_ROLES.map((role) => {
                const active = activeRoles.has(role);
                const color = ROLE_COLORS[role];
                const count = countByRole[role] ?? 0;
                return (
                  <button
                    key={role}
                    onClick={() => onToggleRole(role)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left"
                    style={{
                      background: active ? `${color}22` : "var(--color-surface-elevated)",
                      border: `1px solid ${active ? color : "var(--color-border)"}`,
                      color: active ? color : "var(--color-text-secondary)",
                      opacity: active ? 1 : 0.6,
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: active ? color : "var(--color-border)" }}
                    />
                    <span className="flex-1">{ROLE_LABELS[role]}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: active ? `${color}33` : "var(--color-border)",
                        color: active ? color : "var(--color-text-secondary)",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Network incident reporting */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
              Signaler une panne réseau
            </p>
            <AddressSearch onAddIncident={onAddIncident} />
            {incidents.length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <line x1="1" y1="1" x2="23" y2="23"/>
                      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
                      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
                      <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
                      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                      <line x1="12" y1="20" x2="12.01" y2="20"/>
                    </svg>
                    <span className="text-xs leading-tight truncate flex-1" style={{ color: "#ef4444" }}>
                      {inc.label.split(",")[0]}
                    </span>
                    <button
                      onClick={() => onRemoveIncident(inc.id)}
                      className="flex-shrink-0 rounded p-0.5 transition-colors hover:bg-red-500/20"
                      title="Supprimer ce marqueur"
                      style={{ color: "#ef4444" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* People list */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {filteredPeople.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
                Aucun résultat
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredPeople.map((person, i) => {
                  const color = ROLE_COLORS[person.role];
                  const initials = `${person.prenom[0]}${person.nom[0]}`.toUpperCase();
                  const isSelected = selectedPerson === person;
                  return (
                    <button
                      key={i}
                      onClick={() => onPersonSelect(person)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: isSelected ? `${color}22` : "transparent",
                        border: `1px solid ${isSelected ? color : "transparent"}`,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: color }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold leading-tight truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {person.prenom} {person.nom}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                          {person.ville}
                        </p>
                      </div>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ background: `${color}33`, color }}
                      >
                        {person.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
