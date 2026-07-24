"use client";

import { useState, useTransition } from "react";
import { setAdminZone } from "@/app/actions/admin";

interface Zone {
  id: string;
  label: string;
  resourceCount?: number;
}

interface AdminZoneModalProps {
  zones: Zone[];
  /** When true the modal cannot be dismissed — forced on first login */
  forceOpen?: boolean;
  /** When true (change-zone button) allow dismissal */
  onClose?: () => void;
}

/** Zone colour accents — add entries here as new zones are created */
const ZONE_ACCENT: Record<string, { color: string; bg: string; dept: string }> = {
  NAQ: {
    color:  "#38bdf8",
    bg:     "rgba(56,189,248,0.08)",
    dept:   "Nouvelle-Aquitaine — 16, 17, 19, 23, 24, 33, 79, 86, 87",
  },
  HDF: {
    color:  "#22c55e",
    bg:     "rgba(34,197,94,0.08)",
    dept:   "Hauts-de-France — 02, 08, 59, 60, 62, 80",
  },
};

const DEFAULT_ACCENT = { color: "#a855f7", bg: "rgba(168,85,247,0.08)", dept: "" };

export default function AdminZoneModal({ zones, forceOpen = false, onClose }: AdminZoneModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(id: string) {
    if (isPending) return;
    setSelectedId(id);
    startTransition(async () => {
      await setAdminZone(id);
      // Full page reload — forces page.tsx to re-run server-side with the new
      // cookie, and ensures SWR + all client state start fresh with the correct zone.
      window.location.href = "/";
    });
  }

  return (
    /* Backdrop — non-dismissible when forceOpen */
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={forceOpen ? undefined : onClose}
    >
      {/* Panel */}
      <div
        className="w-full sm:w-[480px] sm:max-w-[95vw] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
          /* Push above Android nav bar */
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 24px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-4 pb-5 sm:pt-6">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
            style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
              Sélection de la zone
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Choisissez la secto à consulter
            </p>
          </div>
          {!forceOpen && onClose && (
            <button
              onClick={onClose}
              className="ml-auto flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              aria-label="Fermer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "var(--color-border)", margin: "0 24px" }} />

        {/* Zone list */}
        <div className="flex flex-col gap-3 overflow-y-auto px-6 py-5" style={{ flex: 1 }}>
          {zones.map((zone) => {
            const accent = ZONE_ACCENT[zone.id] ?? DEFAULT_ACCENT;
            const isLoading = isPending && selectedId === zone.id;

            return (
              <button
                key={zone.id}
                onClick={() => handleSelect(zone.id)}
                disabled={isPending}
                className="w-full text-left flex items-center gap-4 px-4 py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: accent.bg,
                  border: `1px solid ${accent.color}33`,
                  cursor: isPending ? "wait" : "pointer",
                }}
                onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.border = `1px solid ${accent.color}88`; }}
                onMouseLeave={(e) => { e.currentTarget.style.border = `1px solid ${accent.color}33`; }}
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
                  style={{ background: `${accent.color}18`, border: `1px solid ${accent.color}40` }}
                >
                  {isLoading ? (
                    <div
                      className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: accent.color, borderTopColor: "transparent" }}
                    />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-bold" style={{ color: accent.color }}>
                    {zone.label}
                  </span>
                  {accent.dept && (
                    <span className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {accent.dept}
                    </span>
                  )}
                  {zone.resourceCount !== undefined && (
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {zone.resourceCount} ressource{zone.resourceCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <div className="ml-auto flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 pt-1">
          <p className="text-xs text-center" style={{ color: "var(--color-text-secondary)" }}>
            Session administrateur — accès lecture seule toutes zones
          </p>
        </div>
      </div>
    </div>
  );
}
