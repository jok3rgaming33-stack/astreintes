"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("Lien de vérification invalide ou expiré.");
      return;
    }

    authClient.verifyEmail({ query: { token } })
      .then((res) => {
        if (res.error) {
          setStatus("error");
          setErrorMsg(res.error.message ?? "Le lien est invalide ou a expiré.");
        } else {
          setStatus("success");
          // Auto-redirect after 3 s
          setTimeout(() => router.push("/"), 3000);
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMsg("Une erreur inattendue s'est produite.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--color-bg-primary)" }}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center gap-6 p-8 rounded-2xl text-center"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
        }}
      >
        {status === "loading" && (
          <>
            <div
              className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "#38bdf8", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Vérification en cours...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.4)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                Adresse e-mail confirmée
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Votre compte est activé. Vous allez être redirigé automatiquement...
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #38bdf8)", color: "#0f172a" }}
            >
              Accéder à l&apos;application
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full"
              style={{ background: "rgba(239,68,68,0.12)", border: "2px solid rgba(239,68,68,0.4)" }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                Lien invalide
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {errorMsg}
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </main>
  );
}
