"use client";

import { useState, useEffect } from "react";
import {
  getNotifPermission,
  requestNotifPermission,
  type NotifPermission,
} from "@/lib/notifications";

/**
 * Banner shown once on first open when Notification permission is "default".
 * Disappears once the user grants or denies.
 */
export default function NotificationBanner() {
  const [perm, setPerm] = useState<NotifPermission>("granted"); // optimistic — avoids flash
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const current = getNotifPermission();
    setPerm(current);
    // Auto-dismiss if already decided
    if (current !== "default") setDismissed(true);
  }, []);

  if (dismissed || perm !== "default") return null;

  const handleAllow = async () => {
    const result = await requestNotifPermission();
    setPerm(result);
    setDismissed(true);
  };

  const handleDeny = () => {
    setDismissed(true);
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-[3000] flex items-start sm:items-center justify-between gap-3 px-4 py-3 sm:py-2.5"
      style={{
        background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
        borderBottom: "1px solid rgba(99,102,241,0.3)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      }}
    >
      {/* Bell icon */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <p className="text-xs sm:text-sm leading-snug" style={{ color: "#cbd5e1" }}>
          <span className="font-semibold" style={{ color: "#e2e8f0" }}>
            Activer les notifications
          </span>{" "}
          pour être alerté en temps réel lors de la déclaration d&apos;une panne.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleAllow}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95"
          style={{
            background: "#6366f1",
            color: "#fff",
          }}
        >
          Activer
        </button>
        <button
          onClick={handleDeny}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95"
          style={{
            background: "transparent",
            border: "1px solid rgba(148,163,184,0.3)",
            color: "#94a3b8",
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
