"use client";

import { useEffect, useState } from "react";

/**
 * Displays a reminder banner every Thursday from 12:00 onward (and all day),
 * reminding that the on-call resources update must be done Friday at 09:00.
 * Dismissable — stays hidden for the rest of the current Thursday only.
 */
export default function UpdateReminderBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const isThursday = now.getDay() === 4; // 0=Sun … 4=Thu
      const afterNoon = now.getHours() >= 12;

      // Dismissed for today?
      let dismissedKey = "";
      try {
        dismissedKey = localStorage.getItem("astreinte-reminder-dismissed") ?? "";
      } catch {
        /* ignore */
      }
      const todayKey = now.toISOString().slice(0, 10);

      setVisible(isThursday && afterNoon && dismissedKey !== todayKey);
    };

    check();
    // Re-check every minute so it appears right at 12:00
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = () => {
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      localStorage.setItem("astreinte-reminder-dismissed", todayKey);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[2500] flex items-center gap-3 px-4 py-2.5"
      style={{
        background: "#eab308",
        color: "#111827",
        boxShadow: "0 2px 12px rgba(0,0,0,0.35)",
        paddingTop: "max(0.625rem, env(safe-area-inset-top, 0px))",
      }}
      role="alert"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
      <p className="flex-1 text-xs font-semibold leading-snug text-balance">
        Rappel : la mise à jour des ressources en astreinte doit être effectuée
        demain <strong>vendredi à 09h00</strong>.
      </p>
      <button
        onClick={dismiss}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/10"
        style={{ color: "#111827" }}
        aria-label="Fermer le rappel"
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
  );
}
