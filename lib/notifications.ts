/**
 * Browser Notification helpers.
 * All notifications are local (Web Notifications API) — every user who
 * has the app open and has granted permission will see them.
 */

export type NotifPermission = "default" | "granted" | "denied";

export function getNotifPermission(): NotifPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission as NotifPermission;
}

/** Ask for permission. Returns the resulting permission state. */
export async function requestNotifPermission(): Promise<NotifPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result as NotifPermission;
  } catch {
    return "denied";
  }
}

/** Fire a notification. Silently no-ops if permission not granted or API unsupported. */
export function sendNotification(
  title: string,
  options?: { body?: string; icon?: string; tag?: string }
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const n = new Notification(title, {
      icon: "/icon.jpg",
      badge: "/icon.jpg",
      ...options,
    });
    // Auto-close after 8 s
    setTimeout(() => { try { n.close(); } catch { /* ignore */ } }, 8000);
  } catch {
    // iOS Safari and some mobile browsers throw on new Notification() outside SW context
  }
}

/**
 * Build the notification body for a new incident.
 * Lists the recipients: on-call persons + CIR/REF + proximity persons.
 */
export function buildIncidentNotifBody(params: {
  label: string;
  onCallNames: string[];
  proximityNames: string[];
}): { title: string; body: string } {
  const shortLabel =
    params.label.length > 60 ? params.label.slice(0, 57) + "…" : params.label;

  const allNames = [
    ...new Set([...params.onCallNames, ...params.proximityNames]),
  ];

  const body =
    allNames.length > 0
      ? `Astreinte & proximité : ${allNames.slice(0, 4).join(", ")}${allNames.length > 4 ? ` +${allNames.length - 4}` : ""}`
      : "Aucune personne disponible trouvée.";

  return {
    title: `Panne signalée — ${shortLabel}`,
    body,
  };
}
