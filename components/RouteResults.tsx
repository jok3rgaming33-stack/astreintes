"use client";

import { ROLE_COLORS, ROLE_LABELS } from "@/lib/people";
import type { RouteResult } from "@/lib/routing";
import type { NetworkIncident } from "@/components/AddressSearch";

interface RouteResultsProps {
  incident: NetworkIncident;
  results: RouteResult[];
  loading: boolean;
  onClose: () => void;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function RouteResults({
  incident,
  results,
  loading,
  onClose,
}: RouteResultsProps) {
  const onCallResults = results.filter((r) => r.isOnCall);
  const nearbyResults = results.filter((r) => !r.isOnCall);

  return (
    <div
      className="absolute top-4 right-4 z-[1500] flex flex-col rounded-xl overflow-hidden"
      style={{
        width: "min(340px, calc(100vw - 2rem))",
        maxHeight: "calc(100dvh - 6rem)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(239,68,68,0.08)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#ef4444" }}>
            Panne signalée
          </p>
          <p className="text-xs leading-tight truncate" style={{ color: "var(--color-text-secondary)" }}>
            {incident.label}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
          style={{ color: "var(--color-text-secondary)" }}
          title="Fermer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
            />
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Calcul des itinéraires en cours…
            </p>
          </div>
        ) : results.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "var(--color-text-secondary)" }}>
            Aucune personne disponible dans un rayon d&apos;1 heure.
          </p>
        ) : (
          <>
            {/* On-call section */}
            {onCallResults.length > 0 && (
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2" style={{ color: "#10b981" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "#10b981" }} />
                  En astreinte
                </p>
                <div className="flex flex-col gap-1.5">
                  {onCallResults.map((r) => (
                    <PersonRow key={`${r.person.nom}-${r.person.prenom}`} result={r} />
                  ))}
                </div>
              </div>
            )}

            {/* Nearby section */}
            {nearbyResults.length > 0 && (
              <div className="px-3 pt-3 pb-3">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  A proximite (&le; 1 h de route)
                </p>
                <div className="flex flex-col gap-1.5">
                  {nearbyResults.map((r) => (
                    <PersonRow key={`${r.person.nom}-${r.person.prenom}`} result={r} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PersonRow({ result }: { result: RouteResult }) {
  const { person, distanceKm, durationMin, isOnCall } = result;
  const color = ROLE_COLORS[person.role];
  const initials = `${person.prenom[0]}${person.nom.slice(0, 2)}`.toUpperCase();

  return (
    <div
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg"
      style={{
        background: isOnCall ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isOnCall ? "rgba(16,185,129,0.3)" : "var(--color-border)"}`,
      }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{
          background: color,
          boxShadow: isOnCall ? "0 0 0 2px #10b981" : "none",
        }}
      >
        {initials}
      </div>

      {/* Name + city + role */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-xs font-semibold leading-tight truncate" style={{ color: "var(--color-text-primary)" }}>
            {person.prenom} {person.nom}
          </p>
          <span
            className="text-xs font-bold px-1 py-0 rounded flex-shrink-0"
            style={{
              background: `${color}22`,
              color: color,
              fontSize: "10px",
              lineHeight: "16px",
              border: `1px solid ${color}55`,
            }}
          >
            {ROLE_LABELS[person.role]}
          </span>
        </div>
        <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
          {person.ville}
        </p>
      </div>

      {/* Distance + duration */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs font-bold leading-tight" style={{ color: isOnCall ? "#10b981" : "var(--color-text-primary)" }}>
          {formatDuration(durationMin)}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {distanceKm} km
        </p>
      </div>
    </div>
  );
}
