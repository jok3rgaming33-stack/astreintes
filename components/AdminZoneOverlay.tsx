"use client";

import { useState } from "react";
import AdminZoneModal from "@/components/AdminZoneModal";

interface Zone {
  id: string;
  label: string;
  resourceCount?: number;
}

interface Props {
  zones: Zone[];
  /** When provided, a zone is already selected — show children + change button */
  selectedZone?: string;
  children?: React.ReactNode;
}

export default function AdminZoneOverlay({ zones, selectedZone, children }: Props) {
  // No zone selected yet → force modal open, no content underneath
  const [modalOpen, setModalOpen] = useState(!selectedZone);

  const currentZone = zones.find((z) => z.id === selectedZone);

  return (
    <div className="relative w-full h-full">
      {/* Main content (AppShell) — only rendered when a zone is selected */}
      {selectedZone && children}

      {/* Floating "Changer de zone" button — only visible when zone is active */}
      {selectedZone && !modalOpen && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
          style={{
            top: "12px",
            right: "56px",
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(56,189,248,0.35)",
            color: "#38bdf8",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid rgba(56,189,248,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid rgba(56,189,248,0.35)")}
          title="Changer de zone"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span className="hidden sm:inline">{currentZone?.label ?? selectedZone}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      )}

      {/* Admin zone selection modal */}
      {modalOpen && (
        <AdminZoneModal
          zones={zones}
          forceOpen={!selectedZone}
          onClose={selectedZone ? () => setModalOpen(false) : undefined}
        />
      )}

      {/* If no zone yet — dark background behind modal */}
      {!selectedZone && (
        <div
          className="fixed inset-0 -z-10"
          style={{ background: "var(--color-background)" }}
        />
      )}
    </div>
  );
}
