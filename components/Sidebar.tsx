"use client";

import { useState, useMemo } from "react";
import { PEOPLE, ROLE_COLORS, ROLE_LABELS, type Person, type Role } from "@/lib/people";
import { getOnCallNoms } from "@/lib/schedule";
import AddressSearch, { type NetworkIncident } from "@/components/AddressSearch";

const ALL_ROLES: Role[] = ["CIR", "REF", "TMF", "TMRa", "TMRe"];

interface SidebarProps {
  /** Active people list — use the usePeople() hook result in the parent */
  people?: Person[];
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
  /** When true, hides the person list (shown in a separate modal on mobile) */
  hidePersonList?: boolean;
  /** Called when the "Voir les effectifs" button is clicked */
  onOpenEffectifs?: () => void;
  /** Set of person noms currently on-call — shown as a banner and highlighted in the list */
  onCallNoms?: Set<string>;
  /** Set of person noms currently on holiday — excluded from routing */
  holidayNoms?: Set<string>;
  /** Toggle a person into/out of the on-call set manually */
  onToggleOnCall?: (nom: string) => void;
  /** Toggle a person into/out of the holiday set */
  onToggleHoliday?: (nom: string) => void;
  /** Shared "astreintes uniquement" filter — also hides non-on-call people on the map */
  onlyOnCall?: boolean;
  onToggleOnlyOnCall?: () => void;
}

export default function Sidebar({
  people: peopleProp,
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
  hidePersonList = false,
  onOpenEffectifs,
  onCallNoms,
  holidayNoms = new Set(),
  onToggleOnCall,
  onToggleHoliday,
  onlyOnCall = false,
  onToggleOnlyOnCall,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Use provided people list, fall back to the static constant
  const people = peopleProp ?? PEOPLE;

  // Fall back to computing locally if not provided (e.g. storybook / tests)
  const effectiveOnCallNoms = useMemo(
    () => onCallNoms ?? getOnCallNoms(new Date()),
    [onCallNoms]
  );

  const filteredPeople = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return people.filter((p) => {
      // On-call persons always shown regardless of role filter (holiday persons too — but greyed)
      const matchesRole =
        activeRoles.has(p.role) ||
        effectiveOnCallNoms.has(p.nom) ||
        holidayNoms.has(p.nom);
      const matchesSearch =
        q === "" ||
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        p.ville.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [activeRoles, searchQuery, effectiveOnCallNoms, holidayNoms]);

  const countByRole = useMemo(() => {
    const counts: Partial<Record<Role, number>> = {};
    people.forEach((p) => {
      counts[p.role] = (counts[p.role] ?? 0) + 1;
    });
    return counts;
  }, [people]);

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
                {filteredPeople.length} / {people.length} personnes
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

            {/* Astreintes-only filter — also hides non-on-call people on the map */}
            {onToggleOnlyOnCall && (
              <button
                onClick={onToggleOnlyOnCall}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: onlyOnCall ? "rgba(234,179,8,0.2)" : "var(--color-surface-elevated)",
                  border: `1px solid ${onlyOnCall ? "#eab308" : "var(--color-border)"}`,
                  color: onlyOnCall ? "#eab308" : "var(--color-text-secondary)",
                }}
                title="Filtre appliqué à la liste et à la carte"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={onlyOnCall ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <line x1="6" y1="1" x2="6" y2="4" />
                  <line x1="10" y1="1" x2="10" y2="4" />
                  <line x1="14" y1="1" x2="14" y2="4" />
                </svg>
                {onlyOnCall ? "Afficher tous les effectifs" : "N'afficher que les astreintes"}
              </button>
            )}
          </div>

          {/* Scrollable content — prevents the sidebar from freezing when many on-call */}
          <div className="flex-1 overflow-y-auto min-h-0">

          {/* On-call banner */}
          {effectiveOnCallNoms.size > 0 && (
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(16,185,129,0.07)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#10b981" }}>
                <span
                  className="inline-block w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#10b981" }}
                />
                En astreinte aujourd&apos;hui
              </p>
              <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: "200px" }}>
                {people.filter((p) => effectiveOnCallNoms.has(p.nom) && !holidayNoms.has(p.nom)).map((p) => {
                  const color = ROLE_COLORS[p.role];
                  const initials = `${p.prenom[0]}${p.nom.slice(0, 2)}`.toUpperCase();
                  return (
                    <button
                      key={`${p.nom}-${p.prenom}`}
                      onClick={() => onPersonSelect(p)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-white/5"
                      style={{ border: "1px solid rgba(245,158,11,0.3)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: color, boxShadow: "0 0 0 2px #10b981" }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold leading-tight truncate" style={{ color: "var(--color-text-primary)" }}>
                          {p.prenom} {p.nom}
                        </p>
                        <p className="text-xs truncate" style={{ color: "#10b981", opacity: 0.8 }}>
                          {p.ville}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* "Voir les effectifs" button — shown in mobile sheet instead of inline list */}
          {hidePersonList && onOpenEffectifs && (
            <div className="px-4 py-4">
              <button
                onClick={onOpenEffectifs}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: "var(--color-accent)",
                  color: "#fff",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Voir les effectifs
              </button>
            </div>
          )}

          {/* People list — hidden on mobile (shown in dedicated modal) */}
          {!hidePersonList && <div className="flex-1 overflow-y-auto px-3 py-3">
            {filteredPeople.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
                Aucun résultat
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredPeople.map((person, i) => {
                  const color = ROLE_COLORS[person.role];
                  const initials = `${person.prenom[0]}${person.nom.slice(0, 2)}`.toUpperCase();
                  const isSelected = selectedPerson === person;
                  const isOnCall = effectiveOnCallNoms.has(person.nom);
                  const isHoliday = holidayNoms.has(person.nom);

                  let rowBg = "transparent";
                  let rowBorder = "transparent";
                  if (isHoliday) { rowBg = "rgba(107,114,128,0.08)"; rowBorder = "rgba(107,114,128,0.3)"; }
                  else if (isSelected) { rowBg = `${color}22`; rowBorder = color; }
                  else if (isOnCall) { rowBg = "rgba(16,185,129,0.06)"; rowBorder = "rgba(16,185,129,0.4)"; }

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: rowBg,
                        border: `1px solid ${rowBorder}`,
                        opacity: isHoliday ? 0.6 : 1,
                      }}
                    >
                      {/* Avatar */}
                      <button
                        onClick={() => onPersonSelect(person)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative"
                          style={{
                            background: isHoliday ? "#6b7280" : color,
                            boxShadow: isOnCall ? "0 0 0 2px #10b981" : "none",
                          }}
                        >
                          {initials}
                          {isOnCall && !isHoliday && (
                            <span
                              className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-black font-black"
                              style={{ background: "#10b981", fontSize: "7px", border: "1.5px solid var(--color-surface)" }}
                            >!</span>
                          )}
                          {isHoliday && (
                            <span
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                              style={{ background: "#374151", fontSize: "8px", border: "1.5px solid var(--color-surface)" }}
                            >🌴</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--color-text-primary)" }}>
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
                          {ROLE_LABELS[person.role]}
                        </span>
                      </button>

                      {/* Astreinte toggle */}
                      <button
                        onClick={() => onToggleOnCall?.(person.nom)}
                        disabled={isHoliday}
                        title={isOnCall ? "Retirer de l'astreinte" : "Mettre en astreinte"}
                        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                        style={{
                          background: isOnCall ? "rgba(16,185,129,0.2)" : "var(--color-surface-elevated)",
                          border: `1px solid ${isOnCall ? "#10b981" : "var(--color-border)"}`,
                          color: isOnCall ? "#10b981" : "var(--color-text-secondary)",
                          opacity: isHoliday ? 0.3 : 1,
                          cursor: isHoliday ? "not-allowed" : "pointer",
                        }}
                      >
                        {/* Gyrophare bleu — astreinte */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={isOnCall ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a6 6 0 0 1 6 6c0 3-2 5-3 7H9c-1-2-3-4-3-7a6 6 0 0 1 6-6z" />
                          <line x1="12" y1="2" x2="12" y2="0" />
                          <line x1="4.22" y1="4.22" x2="2.81" y2="2.81" />
                          <line x1="19.78" y1="4.22" x2="21.19" y2="2.81" />
                          <rect x="9" y="15" width="6" height="2" rx="1" />
                          <rect x="10" y="17" width="4" height="2" rx="1" />
                        </svg>
                      </button>

                      {/* Vacances toggle */}
                      <button
                        onClick={() => onToggleHoliday?.(person.nom)}
                        title={isHoliday ? "Retirer les vacances" : "Marquer en vacances"}
                        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors text-sm"
                        style={{
                          background: isHoliday ? "rgba(107,114,128,0.25)" : "var(--color-surface-elevated)",
                          border: `1px solid ${isHoliday ? "#9ca3af" : "var(--color-border)"}`,
                          color: isHoliday ? "#d1d5db" : "var(--color-text-secondary)",
                        }}
                      >
                        🌴
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>}
          </div>
        </>
      )}
    </aside>
  );
}
