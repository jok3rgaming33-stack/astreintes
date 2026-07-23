import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";
import Image from "next/image";

export const metadata = {
  title: "Connexion — Ressources Astreinte",
  description: "Accès sécurisé à la plateforme de gestion des astreintes réseau Free Mobile.",
};

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) redirect("/");

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: "#070d1a" }}
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-bg.png"
          alt=""
          fill
          className="object-cover opacity-50"
          priority
        />
        {/* Dark gradient overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 50%, rgba(7,13,26,0.3) 0%, rgba(7,13,26,0.85) 70%)",
          }}
        />
      </div>

      {/* Animated fiber pulse rings */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${300 + i * 180}px`,
              height: `${300 + i * 180}px`,
              top: "50%",
              left: "60%",
              transform: "translate(-50%, -50%)",
              border: "1px solid rgba(56,189,248,0.08)",
              animation: `pulse-ring ${3 + i}s ease-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Status badges — top right corner */}
      <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
        <StatusBadge icon="wifi-off" label="2 pannes actives" color="#ef4444" />
        <StatusBadge icon="wrench" label="Maintenance en cours" color="#f97316" />
        <StatusBadge icon="signal" label="Réseau opérationnel à 97%" color="#22c55e" />
      </div>

      {/* Main card */}
      <main
        className="relative z-10 w-full max-w-sm mx-4 flex flex-col gap-6 p-8 rounded-2xl"
        style={{
          background: "rgba(15,23,42,0.85)",
          border: "1px solid rgba(56,189,248,0.15)",
          boxShadow:
            "0 0 0 1px rgba(56,189,248,0.05), 0 24px 64px rgba(0,0,0,0.6), 0 0 80px rgba(14,165,233,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-4">
          {/* Free logo */}
          <div
            className="flex items-center justify-center rounded-2xl overflow-hidden"
            style={{
              width: "90px",
              height: "90px",
              background: "#fff",
              boxShadow: "0 0 24px rgba(227,6,19,0.25), 0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
            <Image
              src="/free-logo.jpg"
              alt="Free"
              width={90}
              height={90}
              className="object-cover"
              priority
            />
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "#f0f9ff" }}>
              Ressources Astreinte
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.8)" }}>
              Plateforme de gestion des astreintes réseau
            </p>
          </div>

          {/* Divider with fiber glow */}
          <div className="w-full flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(56,189,248,0.3))" }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h5" /><path d="M17 12h5" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v5" /><path d="M12 17v5" />
            </svg>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(56,189,248,0.3))" }} />
          </div>
        </div>

        {/* Form */}
        <LoginForm />

        {/* Footer */}
        <p className="text-center text-xs" style={{ color: "rgba(100,116,139,0.7)" }}>
          Free Mobile · Réseau &amp; Astreintes
        </p>
      </main>

      {/* Bottom ticker */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden"
        style={{
          background: "rgba(7,13,26,0.9)",
          borderTop: "1px solid rgba(56,189,248,0.1)",
        }}
      >
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="inline-block w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: "#38bdf8" }} />
          <p className="text-xs whitespace-nowrap" style={{ color: "rgba(148,163,184,0.7)" }}>
            Système de gestion des astreintes terrain · Couverture 4G/5G · Accès restreint aux agents habilités
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Small status badge ───────────────────────────────────────────────────────

function StatusBadge({
  icon,
  label,
  color,
}: {
  icon: "wifi-off" | "wrench" | "signal";
  label: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
      style={{
        background: "rgba(7,13,26,0.85)",
        border: `1px solid ${color}30`,
        color,
        backdropFilter: "blur(8px)",
      }}
    >
      {icon === "wifi-off" && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      )}
      {icon === "wrench" && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      )}
      {icon === "signal" && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20h.01" />
          <path d="M7 20v-4" />
          <path d="M12 20v-8" />
          <path d="M17 20V8" />
          <path d="M22 4v16" />
        </svg>
      )}
      {label}
    </div>
  );
}
