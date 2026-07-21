"use client";

import { useState, useMemo } from "react";
import { PEOPLE, ROLE_COLORS, ROLE_LABELS, type Person, type Role } from "@/lib/people";

const ALL_ROLES: Role[] = ["CIR", "REF", "TMF", "TMRa", "TMRe"];

interface SidebarProps {
  activeRoles: Set<Role>;
  onToggleRole: (role: Role) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  onPersonSelect: (person: Person) => void;
  selectedPerson: Person | null;
}

export default function Sidebar({
  activeRoles,
  onToggleRole,
  searchQuery,
  onSearch,
  onPersonSelect,
  selectedPerson,
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
        width: collapsed ? "56px" : "320px",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        flexShrink: 0,
      }}
    >
      {/* Header */}
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

      {!collapsed && (
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
