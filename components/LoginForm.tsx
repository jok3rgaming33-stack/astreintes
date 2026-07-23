"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { PEOPLE } from "@/lib/people";

// Map emails from the resources list to their nom (for display / linking)
const EMAIL_TO_NOM: Record<string, string> = {
  "pabrantes@iliad-free.fr": "ABRANTES",
  "mbakkouch@iliad-free.fr": "BAKKOUCH",
  "fbergay@iliad-free.fr": "BERGAY",
  "mbonnel@iliad-free.fr": "BONNEL",
  "jdardy@iliad-free.fr": "DARDY",
  "dfayol@iliad-free.fr": "FAYOL",
  "ngeneste@iliad-free.fr": "GENESTE",
  "rprovin@iliad-free.fr": "PROVIN",
  "sroig@iliad-free.fr": "ROIG",
  "spereira@iliad-free.fr": "PEREIRA",
  "ccruveillier@iliad-free.fr": "CRUVEILLIER",
  "selouazghi@iliad-free.fr": "EL OUAZGHI",
  "kjoliveau@iliad-free.fr": "JOLIVEAU",
  "lalsheikhly@iliad-free.fr": "AL SHEIKHLY",
  "odefoulounoux@iliad-free.fr": "DEFOULOUNOUX",
  "afontaine@iliad-free.fr": "FONTAINE",
  "jregiero@iliad-free.fr": "REGIERO",
  "ballouche@iliad-free.fr": "ALLOUCHE",
  "mcapot@iliad-free.fr": "CAPOT",
  "adevijver@iliad-free.fr": "DEVIJVER",
  "ldumas@iliad-free.fr": "DUMAS",
  "aforissier@iliad-free.fr": "FORISSIER",
  "fjourdan@iliad-free.fr": "JOURDAN",
  "amizouri@iliad-free.fr": "MIZOURI",
  "cpapillon@iliad-free.fr": "PAPILLON",
  "jpovoa@iliad-free.fr": "POVOA",
  "jrabin@iliad-free.fr": "RABIN",
  "avanelle@iliad-free.fr": "VANELLE",
  "jarles@iliad-free.fr": "ARLES",
  "jbrothier@iliad-free.fr": "BROTHIER",
  "nbrunet@iliad-free.fr": "BRUNET",
  "bdjedou@iliad-free.fr": "DJEDOU",
  "ldupre@iliad-free.fr": "DUPRE",
  "mgirard@iliad-free.fr": "GIRARD",
  "giehle@iliad-free.fr": "IEHLE",
  "kjourdain@iliad-free.fr": "JOURDAIN",
  "mkozhukhar@iliad-free.fr": "KOZHUKHAR",
  "mouchaif@iliad-free.fr": "OUCHAIF",
  "mraynaud@iliad-free.fr": "RAYNAUD",
  "arivaud@iliad-free.fr": "RIVAUD",
  "cvergnaud@iliad-free.fr": "VERGNAUD",
  "ebarbier@iliad-free.fr": "BARBIER",
  "fblot@iliad-free.fr": "BLOT",
  "mbonardelrichard@iliad-free.fr": "BONARDEL RICHARD",
  "ccaudron@iliad-free.fr": "CAUDRON",
  "ddesvaud@iliad-free.fr": "DESVAUD",
  "aghaiout@iliad-free.fr": "GHAI OUT",
  "pgrand@iliad-free.fr": "GRAND",
  "nguedon@iliad-free.fr": "GUEDON",
  "jherbere@iliad-free.fr": "HERBERE",
  "jholderbaum@iliad-free.fr": "HOLDERBAUM",
  "akaabouni@iliad-free.fr": "KAABOUNI",
  "klamkim@iliad-free.fr": "LAM KIM",
  "clumineau@iliad-free.fr": "LUMINEAU",
  "ymangeol@iliad-free.fr": "MANGEOL",
  "cmonnin@iliad-free.fr": "MONNIN",
  "porseau@iliad-free.fr": "ORSEAU",
  "kporca@iliad-free.fr": "PORCA",
  "jprevot@iliad-free.fr": "PREVOT",
  "sreynolds@iliad-free.fr": "REYNOLDS",
  "nrouzier@iliad-free.fr": "ROUZIER",
  "vselichar@iliad-free.fr": "SELICHAR",
  "nstanislas@iliad-free.fr": "STANISLAS",
  "ethomas@iliad-free.fr": "THOMAS",
};

// Role from email
const EMAIL_TO_ROLE: Record<string, string> = {
  "pabrantes@iliad-free.fr": "CIR",
  "mbakkouch@iliad-free.fr": "CIR",
  "fbergay@iliad-free.fr": "CIR",
  "mbonnel@iliad-free.fr": "CIR",
  "jdardy@iliad-free.fr": "CIR",
  "dfayol@iliad-free.fr": "CIR",
  "ngeneste@iliad-free.fr": "CIR",
  "rprovin@iliad-free.fr": "CIR",
  "sroig@iliad-free.fr": "CIR",
  "spereira@iliad-free.fr": "Référent",
  "ccruveillier@iliad-free.fr": "Référent",
  "selouazghi@iliad-free.fr": "Référent",
  "kjoliveau@iliad-free.fr": "Référent",
  "lalsheikhly@iliad-free.fr": "Référent",
  "odefoulounoux@iliad-free.fr": "Référent",
  "afontaine@iliad-free.fr": "Référent",
  "jregiero@iliad-free.fr": "Référent",
  "ballouche@iliad-free.fr": "Référent",
  "mcapot@iliad-free.fr": "TMF",
  "adevijver@iliad-free.fr": "TMF",
  "ldumas@iliad-free.fr": "TMF",
  "aforissier@iliad-free.fr": "TMF",
  "fjourdan@iliad-free.fr": "TMF",
  "amizouri@iliad-free.fr": "TMF",
  "cpapillon@iliad-free.fr": "TMF",
  "jpovoa@iliad-free.fr": "TMF",
  "jrabin@iliad-free.fr": "TMF",
  "avanelle@iliad-free.fr": "TMF",
  "jarles@iliad-free.fr": "TMRa",
  "jbrothier@iliad-free.fr": "TMRa",
  "nbrunet@iliad-free.fr": "TMRa",
  "bdjedou@iliad-free.fr": "TMRa",
  "ldupre@iliad-free.fr": "TMRa",
  "mgirard@iliad-free.fr": "TMRa",
  "giehle@iliad-free.fr": "TMRa",
  "kjourdain@iliad-free.fr": "TMRa",
  "mkozhukhar@iliad-free.fr": "TMRa",
  "mouchaif@iliad-free.fr": "TMRa",
  "mraynaud@iliad-free.fr": "TMRa",
  "arivaud@iliad-free.fr": "TMRa",
  "cvergnaud@iliad-free.fr": "TMRa",
  "ebarbier@iliad-free.fr": "TMRe",
  "fblot@iliad-free.fr": "TMRe",
  "mbonardelrichard@iliad-free.fr": "TMRe",
  "ccaudron@iliad-free.fr": "TMRe",
  "ddesvaud@iliad-free.fr": "TMRe",
  "aghaiout@iliad-free.fr": "TMRe",
  "pgrand@iliad-free.fr": "TMRe",
  "nguedon@iliad-free.fr": "TMRe",
  "jherbere@iliad-free.fr": "TMRe",
  "jholderbaum@iliad-free.fr": "TMRe",
  "akaabouni@iliad-free.fr": "TMRe",
  "klamkim@iliad-free.fr": "TMRe",
  "clumineau@iliad-free.fr": "TMRe",
  "ymangeol@iliad-free.fr": "TMRe",
  "cmonnin@iliad-free.fr": "TMRe",
  "porseau@iliad-free.fr": "TMRe",
  "kporca@iliad-free.fr": "TMRe",
  "jprevot@iliad-free.fr": "TMRe",
  "sreynolds@iliad-free.fr": "TMRe",
  "nrouzier@iliad-free.fr": "TMRe",
  "vselichar@iliad-free.fr": "TMRe",
  "nstanislas@iliad-free.fr": "TMRe",
  "ethomas@iliad-free.fr": "TMRe",
};

type Mode = "signin" | "signup";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const knownEmail = email.toLowerCase().trim();
  const isKnownEmail = knownEmail in EMAIL_TO_NOM;

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
        // After signup the role is "user" by default; admin must set it.
        router.push("/");
        router.refresh();
      } else {
        const result = await authClient.signIn.email({
          email: knownEmail,
          password,
        });
        if (result.error) {
          setError("Identifiants incorrects. Vérifiez votre e-mail et mot de passe.");
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

      {/* Confirm password (signup only) */}
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
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
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
        {loading
          ? "Connexion en cours..."
          : mode === "signin"
            ? "Se connecter"
            : "Créer mon compte"}
      </button>

      {/* Mode toggle */}
      <p className="text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
        {mode === "signin" ? (
          <>
            Première connexion ?{" "}
            <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="font-semibold underline underline-offset-2" style={{ color: "#38bdf8" }}>
              Créer un compte
            </button>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="font-semibold underline underline-offset-2" style={{ color: "#38bdf8" }}>
              Se connecter
            </button>
          </>
        )}
      </p>
    </form>
  );
}
