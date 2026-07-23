"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { EMAIL_TO_NOM } from "@/lib/emailToNom";

// kept only to satisfy a trailing reference — remove the inline block below
const _UNUSED = {
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
  "selouazghi@iliad-free.fr": "ELOUAZGHI",
  "kjoliveau@iliad-free.fr": "JOLIVEAU",
  "lalsheikhly@iliad-free.fr": "AL SHEIKHLY",
  "odefoulounoux@iliad-free.fr": "DE FOULOUNOUX",
  "afontaine@iliad-free.fr": "FONTAINE",
  "jregiero@iliad-free.fr": "REGIERO",
  "ballouche@iliad-free.fr": "ALLOUCHE",
  "mcapot@iliad-free.fr": "CAPOT",
  "adevijver@iliad-free.fr": "DE VIJVER",
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
  "aghaiout@iliad-free.fr": "GHAIOUT",
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
// ↑ _UNUSED block end

// Email → role mapping (mirrors LoginForm)
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

export interface UserIdentity {
  role: string;
  nom: string | null; // nom as used in lib/people.ts, null for unknown emails
}

/**
 * Called server-side on the main page after login to ensure the role column
 * is synced from the email → role lookup table.
 * Also returns the nom (matching people.ts) so the UI can restrict
 * status changes to the logged-in person only.
 */
export async function syncUserRole(): Promise<UserIdentity> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { role: "user", nom: null };

  const email = session.user.email.toLowerCase();
  const expectedRole = EMAIL_TO_ROLE[email] ?? "user";
  const nom = EMAIL_TO_NOM[email] ?? null;

  // Only update if the stored role is still the default "user"
  const [row] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (row && row.role === "user" && expectedRole !== "user") {
    await db
      .update(user)
      .set({ role: expectedRole, updatedAt: new Date() })
      .where(eq(user.email, email));
    return { role: expectedRole, nom };
  }

  return { role: row?.role ?? "user", nom };
}
