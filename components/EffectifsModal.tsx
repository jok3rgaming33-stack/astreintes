"use client";

import { useState, useMemo } from "react";
import { PEOPLE, ROLE_COLORS, ROLE_LABELS, type Person } from "@/lib/people";

interface EffectifsModalProps {
  open: boolean;
  onClose: () => void;
  onPersonSelect: (person: Person) => void;
  /** Active people list — from usePeople() hook in parent */
  people?: Person[];
  onCallNoms: Set<string>;
  holidayNoms: Set<string>;
  onToggleOnCall: (nom: string) => void;
  onToggleHoliday: (nom: string) => void;
  /** Shared "astreintes uniquement" filter (controlled) */
  onlyOnCall: boolean;
  onToggleOnlyOnCall: () => void;
  /** Opens the resource management modal */
  onOpenGestion?: () => void;
  /** nom of the currently logged-in user (from lib/people.ts). null = manager */
  currentUserNom?: string | null;
  /** Whether the logged-in user can modify all statuses */
  canManageRessources?: boolean;
}

export default function EffectifsModal({
  open,
  onClose,
  onPersonSelect,
  people: peopleProp,
  onCallNoms,
  holidayNoms,
  onToggleOnCall,
  onToggleHoliday,
  onlyOnCall,
  onToggleOnlyOnCall,
  onOpenGestion,
  currentUserNom = null,
  canManageRessources = false,
}: EffectifsModalProps) {
  // Use provided people list, fall back to the static constant
  const activePeople = peopleProp ?? PEOPLE;
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activePeople.filter((p) => {
      if (onlyOnCall && !onCallNoms.has(p.nom)) return false;
      return (
        q === "" ||
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        p.ville.toLowerCase().includes(q)
      );
    });
  }, [search, onlyOnCall, onCallNoms, activePeople]);

  const onCallList = activePeople.filter(
    (p) => onCallNoms.has(p.nom) && !holidayNoms.has(p.nom)
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex flex-col rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          maxWidth: "460px",
          height: "min(90dvh, 720px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(59,130,246,0.15)",
                border: "1px solid rgba(59,130,246,0.3)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Effectifs
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {activePeople.length} personnes · {onCallList.length} en astreinte
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenGestion && (
              <button
                onClick={onOpenGestion}
                title="Gérer les ressources"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#ef4444",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Gérer
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Search ─────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
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
              placeholder="Rechercher un nom, une ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          {/* Filter: on-call only */}
          <button
            onClick={onToggleOnlyOnCall}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
            style={{
              background: onlyOnCall ? "rgba(234,179,8,0.2)" : "var(--color-surface-elevated)",
              border: `1px solid ${onlyOnCall ? "#eab308" : "var(--color-border)"}`,
              color: onlyOnCall ? "#eab308" : "var(--color-text-secondary)",
            }}
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
        </div>

        {/* ── On-call banner ─────────────────────────────────── */}
        {onCallList.length > 0 && !onlyOnCall && (
          <div
            className="flex-shrink-0 px-4 py-3"
            style={{
              borderBottom: "1px solid var(--color-border)",
              background: "rgba(234,179,8,0.07)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
              style={{ color: "#eab308" }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#eab308" }}
              />
              En astreinte aujourd&apos;hui
            </p>
            <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: "180px" }}>
              {onCallList.map((p) => {
                const color = ROLE_COLORS[p.role];
                const initials = `${p.prenom[0]}${p.nom.slice(0, 2)}`.toUpperCase();
                return (
                  <button
                    key={`${p.prenom}-${p.nom}`}
                    onClick={() => { onPersonSelect(p); onClose(); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors hover:bg-white/5 w-full"
                    style={{ border: "1px solid rgba(234,179,8,0.3)" }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 person-marker-oncall"
                      style={{ background: color }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold leading-tight truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {p.prenom} {p.nom}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "#eab308", opacity: 0.85 }}
                      >
                        {p.ville}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Person list ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <p
              className="text-sm text-center py-10"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Aucun résultat
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((person, i) => {
                const color = ROLE_COLORS[person.role];
                const initials = `${person.prenom[0]}${person.nom.slice(0, 2)}`.toUpperCase();
                const isOnCall = onCallNoms.has(person.nom);
                const isHoliday = holidayNoms.has(person.nom);

                let rowBg = "transparent";
                let rowBorder = "transparent";
                if (isHoliday) {
                  rowBg = "rgba(107,114,128,0.08)";
                  rowBorder = "rgba(107,114,128,0.3)";
                } else if (isOnCall) {
                  rowBg = "rgba(234,179,8,0.06)";
                  rowBorder = "rgba(234,179,8,0.4)";
                }

                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                    style={{
                      background: rowBg,
                      border: `1px solid ${rowBorder}`,
                      opacity: isHoliday ? 0.55 : 1,
                    }}
                  >
                    {/* Avatar + name */}
                    <button
                      onClick={() => { onPersonSelect(person); onClose(); }}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative${isOnCall && !isHoliday ? " person-marker-oncall" : ""}`}
                        style={{
                          background: isHoliday ? "#6b7280" : color,
                        }}
                      >
                        {initials}
                        {isHoliday && (
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-xs"
                            style={{
                              background: "#374151",
                              border: "1.5px solid var(--color-surface)",
                            }}
                          >
                            🌴
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold leading-tight truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {person.prenom} {person.nom}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
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
                    {/* Astreinte toggle — restricted to own profile for non-managers */}
                    {(() => {
                      const isOwnProfile = !currentUserNom || person.nom === currentUserNom;
                      const canToggle = canManageRessources || isOwnProfile;
                      return (
                        <button
                          onClick={() => canToggle && onToggleOnCall(person.nom)}
                          disabled={isHoliday || !canToggle}
                          title={
                            !canToggle
                              ? "Vous ne pouvez modifier que votre propre statut"
                              : isOnCall ? "Retirer de l'astreinte" : "Mettre en astreinte"
                          }
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            background: isOnCall ? "rgba(234,179,8,0.2)" : "var(--color-surface-elevated)",
                            border: `1px solid ${isOnCall ? "#eab308" : "var(--color-border)"}`,
                            color: isOnCall ? "#eab308" : "var(--color-text-secondary)",
                            opacity: (isHoliday || !canToggle) ? 0.3 : 1,
                            cursor: (isHoliday || !canToggle) ? "not-allowed" : "pointer",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill={isOnCall ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            {/* Gyrophare bleu — astreinte */}
                            <path d="M12 2a6 6 0 0 1 6 6c0 3-2 5-3 7H9c-1-2-3-4-3-7a6 6 0 0 1 6-6z" />
                            <line x1="12" y1="2" x2="12" y2="0" />
                            <line x1="4.22" y1="4.22" x2="2.81" y2="2.81" />
                            <line x1="19.78" y1="4.22" x2="21.19" y2="2.81" />
                            <rect x="9" y="15" width="6" height="2" rx="1" />
                            <rect x="10" y="17" width="4" height="2" rx="1" />
                          </svg>
                        </button>
                      );
                    })()}

                    {/* Vacances toggle — restricted to own profile for non-managers */}
                    {(() => {
                      const isOwnProfile = !currentUserNom || person.nom === currentUserNom;
                      const canToggle = canManageRessources || isOwnProfile;
                      return (
                        <button
                          onClick={() => canToggle && onToggleHoliday(person.nom)}
                          disabled={!canToggle}
                          title={
                            !canToggle
                              ? "Vous ne pouvez modifier que votre propre statut"
                              : isHoliday ? "Retirer les vacances" : "Marquer en vacances"
                          }
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-sm"
                          style={{
                            background: isHoliday ? "rgba(107,114,128,0.25)" : "var(--color-surface-elevated)",
                            border: `1px solid ${isHoliday ? "#9ca3af" : "var(--color-border)"}`,
                            opacity: !canToggle ? 0.3 : 1,
                            cursor: !canToggle ? "not-allowed" : "pointer",
                          }}
                        >
                          🌴
                        </button>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
