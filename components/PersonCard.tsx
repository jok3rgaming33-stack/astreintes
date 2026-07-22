"use client";

import { ROLE_COLORS, ROLE_LABELS, type Person } from "@/lib/people";

interface PersonCardProps {
  person: Person;
  onClose: () => void;
  isOnCall?: boolean;
}

export default function PersonCard({ person, onClose, isOnCall = false }: PersonCardProps) {
  const color = ROLE_COLORS[person.role];
  const initials = `${person.prenom[0]}${person.nom.slice(0, 2)}`.toUpperCase();

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-[1001] rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4 pointer-events-auto"
      style={{
        bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
        background: "var(--color-surface)",
        border: `1px solid ${isOnCall ? "#eab30866" : color + "66"}`,
        minWidth: "280px",
        maxWidth: "90vw",
        boxShadow: isOnCall
          ? `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px #eab30833`
          : `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${color}33`,
      }}
    >
      {/* Avatar */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0"
        style={{
          background: color,
          boxShadow: isOnCall ? "0 0 0 3px #eab308, 0 0 12px 4px rgba(234,179,8,0.4)" : "none",
        }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${color}33`, color }}
          >
            {ROLE_LABELS[person.role]}
          </span>
          {isOnCall && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: "rgba(234,179,8,0.2)", color: "#eab308", border: "1px solid rgba(234,179,8,0.4)" }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#eab308" }}
              />
              ASTREINTE
            </span>
          )}
        </div>

        <p className="text-base font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
          {person.prenom} {person.nom}
        </p>

        <div className="flex items-center gap-1.5 mt-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {person.ville} <span className="opacity-60">({person.codePostal})</span>
          </span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="rounded-full p-1.5 transition-colors hover:bg-white/10 flex-shrink-0 self-start"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
