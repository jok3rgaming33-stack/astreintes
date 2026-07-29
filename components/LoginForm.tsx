"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PEOPLE } from "@/lib/people";
import { EMAIL_TO_NOM } from "@/lib/emailToNom";

type Mode = "signin" | "signup";
type Step = "form" | "postal";   // postal = code postal verification after signup

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const knownEmail = email.toLowerCase().trim();
  const isKnownEmail = knownEmail in EMAIL_TO_NOM;

  // ── Step 1 : signup / signin form ─────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!isKnownEmail) {
        setError("Cette adresse e-mail ne correspond à aucune ressource enregistrée.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const nom = EMAIL_TO_NOM[knownEmail] ?? "";
        const person = PEOPLE.find((p) => p.nom === nom);
        const name = person ? `${person.prenom} ${person.nom}` : nom;
        const result = await authClient.signUp.email({
          email: knownEmail,
          password,
          name,
          // @ts-expect-error – additionalFields
          nom,
        });
        if (result.error) {
          setError(result.error.message ?? "Erreur lors de la création du compte.");
          return;
        }
        // Move to postal code verification step
        setStep("postal");
      } else {
        const result = await authClient.signIn.email({
          email: knownEmail,
          password,
        });
        if (result.error) {
          const msg = result.error.message ?? "";
          if (msg.toLowerCase().includes("verif") || msg.toLowerCase().includes("email")) {
            setError("Votre compte n'est pas encore activé. Si vous venez de vous inscrire, saisissez votre code postal pour valider votre compte.");
          } else {
            setError("Identifiants incorrects. Vérifiez votre e-mail et mot de passe.");
          }
          return;
        }
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Une erreur inattendue s'est produite. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 : postal code verification ────────────────────────────────────
  async function handleVerifyPostal(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!codePostal.trim()) {
      setError("Veuillez saisir votre code postal.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-postal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: knownEmail, codePostal: codePostal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Code postal incorrect.");
        return;
      }
      setVerifySuccess(true);
      // Auto-redirect to login after 2 s
      setTimeout(() => {
        setStep("form");
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        setCodePostal("");
        setVerifySuccess(false);
        setError("");
      }, 2500);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render : postal code step ─────────────────────────────────────────────
  if (step === "postal") {
    if (verifySuccess) {
      return (
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{ background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.35)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
              Compte activé !
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Redirection vers la connexion...
            </p>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleVerifyPostal} className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto"
            style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            Vérification de votre identité
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Saisissez le code postal de votre ville de résidence
            pour activer votre compte.
          </p>
          <p className="text-xs font-medium" style={{ color: "#38bdf8" }}>
            {knownEmail}
          </p>
        </div>

        {/* Postal code input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="codePostal" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
            Code postal
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </span>
            <input
              id="codePostal"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              required
              autoFocus
              value={codePostal}
              onChange={(e) => setCodePostal(e.target.value.replace(/\D/g, ""))}
              placeholder="75001"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all tracking-widest font-mono"
              style={{
                background: "rgba(15,23,42,0.7)",
                border: "1px solid rgba(56,189,248,0.2)",
                color: "var(--color-text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(56,189,248,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(56,189,248,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#ef4444" }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || codePostal.length !== 5}
          className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
            color: "#0f172a",
            boxShadow: "0 0 20px rgba(56,189,248,0.25)",
          }}
        >
          {loading ? "Vérification..." : "Activer mon compte"}
        </button>

        <button
          type="button"
          onClick={() => { setStep("form"); setMode("signup"); setError(""); }}
          className="text-xs text-center underline underline-offset-2"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Recommencer l&apos;inscription
        </button>
      </form>
    );
  }

  // ── Render : main signin / signup form ────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          Adresse e-mail
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </span>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom.nom@iliad-free.fr"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "rgba(15,23,42,0.7)",
              border: "1px solid rgba(56,189,248,0.2)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(56,189,248,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)"; }}
            onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(56,189,248,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
        {mode === "signup" && email && !isKnownEmail && (
          <p className="text-xs" style={{ color: "#f97316" }}>
            E-mail non reconnu — seules les ressources enregistrées peuvent créer un compte.
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
          Mot de passe
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input
            id="password"
            type="password"
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={8}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "rgba(15,23,42,0.7)",
              border: "1px solid rgba(56,189,248,0.2)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(56,189,248,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)"; }}
            onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(56,189,248,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
      </div>

      {/* Confirm password */}
      {mode === "signup" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-secondary)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "rgba(15,23,42,0.7)",
                border: `1px solid ${confirmPassword && confirmPassword !== password ? "rgba(239,68,68,0.5)" : "rgba(56,189,248,0.2)"}`,
                color: "var(--color-text-primary)",
              }}
              onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(56,189,248,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.border = confirmPassword && confirmPassword !== password ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(56,189,248,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="text-xs" style={{ color: "#ef4444" }}>Les mots de passe ne correspondent pas.</p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <p className="text-xs leading-relaxed" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        style={{
          background: loading ? "rgba(56,189,248,0.3)" : "linear-gradient(135deg, #0ea5e9, #38bdf8)",
          color: "#0f172a",
          boxShadow: loading ? "none" : "0 0 20px rgba(56,189,248,0.3)",
        }}
      >
        {loading ? "Connexion en cours..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
      </button>

      {/* Mode toggle */}
      <p className="text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {mode === "signin" ? (
          <>
            Premiere connexion ?{" "}
            <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="font-semibold underline underline-offset-2" style={{ color: "#38bdf8" }}>
              Creer un compte
            </button>
          </>
        ) : (
          <>
            Deja un compte ?{" "}
            <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="font-semibold underline underline-offset-2" style={{ color: "#38bdf8" }}>
              Se connecter
            </button>
          </>
        )}
      </p>
    </form>
  );
}
