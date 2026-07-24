"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { EMAIL_TO_NOM, EMAIL_TO_ZONE } from "@/lib/emailToNom";

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
  // ── HDF ──────────────────────────────────────────────────────────────────
  "lbahuchet@iliad-free.fr": "CIR",
  "hbensaber@iliad-free.fr": "CIR",
  "amecheri@iliad-free.fr": "CIR",
  "bsebiane@iliad-free.fr": "CIR",
  "bguenard@iliad-free.fr": "CIR",
  "ppepin@iliad-free.fr": "CIR",
  "sabouelhak@iliad-free.fr": "CIR",
  "ssahraoui@iliad-free.fr": "CIR",
  "asouidi@iliad-free.fr": "CIR",
  "spochez@iliad-free.fr": "CIR",
  "aelbaddagui@iliad-free.fr": "Référent",
  "afauveaux@iliad-free.fr": "Référent",
  "cthompson@iliad-free.fr": "Référent",
  "ktournand@iliad-free.fr": "Référent",
  "atournet@iliad-free.fr": "Référent",
  "sdom@iliad-free.fr": "Référent",
  "nmessadi@iliad-free.fr": "Référent",
  "trogere@iliad-free.fr": "Référent",
  "aksylla@iliad-free.fr": "Référent",
  "abhocine@iliad-free.fr": "TMF",
  "bbendeddouche@iliad-free.fr": "TMF",
  "cparent@iliad-free.fr": "TMF",
  "ddecroix@iliad-free.fr": "TMF",
  "dmarques@iliad-free.fr": "TMF",
  "fbarbier@iliad-free.fr": "TMF",
  "fmontagne@iliad-free.fr": "TMF",
  "gjovenin@iliad-free.fr": "TMF",
  "hbenali@iliad-free.fr": "TMF",
  "jlhuillier@iliad-free.fr": "TMF",
  "lbendali@iliad-free.fr": "TMF",
  "mbouabdallah@iliad-free.fr": "TMF",
  "mboulahya@iliad-free.fr": "TMF",
  "mburet@iliad-free.fr": "TMF",
  "mdelbecque@iliad-free.fr": "TMF",
  "mgarrigue@iliad-free.fr": "TMF",
  "ocoutelier@iliad-free.fr": "TMRa",
  "pgosselin@iliad-free.fr": "TMRa",
  "pmanchon@iliad-free.fr": "TMRa",
  "pvantorre@iliad-free.fr": "TMRa",
  "svignaud@iliad-free.fr": "TMRa",
  "tmarion@iliad-free.fr": "TMRa",
  "wlouis@iliad-free.fr": "TMRa",
  "abaudart@iliad-free.fr": "TMRa",
  "abenbouziane@iliad-free.fr": "TMRa",
  "acollignon@iliad-free.fr": "TMRa",
  "aelasri@iliad-free.fr": "TMRa",
  "alevallois@iliad-free.fr": "TMRa",
  "amatigot@iliad-free.fr": "TMRa",
  "bhamouche@iliad-free.fr": "TMRa",
  "bmachado@iliad-free.fr": "TMRa",
  "cbarra@iliad-free.fr": "TMRe",
  "cdelbecque@iliad-free.fr": "TMRe",
  "cgrimonprez@iliad-free.fr": "TMRe",
  "chabran@iliad-free.fr": "TMRe",
  "clalieu@iliad-free.fr": "TMRe",
  "cmahieu@iliad-free.fr": "TMRe",
  "dcharpentier@iliad-free.fr": "TMRe",
  "dfauvel@iliad-free.fr": "TMRe",
  "dhubert@iliad-free.fr": "TMRe",
  "fcrombez@iliad-free.fr": "TMRe",
  "fflamand@iliad-free.fr": "TMRe",
  "gduquenoy@iliad-free.fr": "TMRe",
  "gpierru@iliad-free.fr": "TMRe",
  "hlefebvre@iliad-free.fr": "TMRe",
  "jcote@iliad-free.fr": "TMRe",
  "jleclercq@iliad-free.fr": "TMRe",
  "jrault@iliad-free.fr": "TMRe",
  "lloonis@iliad-free.fr": "TMRe",
  "mlvangheluwe@iliad-free.fr": "TMRe",
  "mperon@iliad-free.fr": "TMRe",
  "odauphin@iliad-free.fr": "TMRe",
  "pcattelot@iliad-free.fr": "TMRe",
  "smoussa@iliad-free.fr": "TMRe",
};

export interface UserIdentity {
  role: string;
  nom: string | null;
  zoneId: string;
}

/**
 * Called server-side on the main page after login.
 * Syncs role, nom and zoneId from the email lookup tables into the user row.
 */
export async function syncUserRole(): Promise<UserIdentity> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { role: "user", nom: null, zoneId: "NAQ" };

  const email = session.user.email.toLowerCase();
  const expectedRole = EMAIL_TO_ROLE[email] ?? "user";
  const nom = EMAIL_TO_NOM[email] ?? null;
  // All current users are NAQ — future sectos will be added to EMAIL_TO_ZONE
  const zoneId = EMAIL_TO_ZONE[email] ?? "NAQ";

  const [row] = await db
    .select({ role: user.role, zoneId: user.zoneId, nom: user.nom })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  const needsUpdate =
    (row?.role === "user" && expectedRole !== "user") ||
    row?.zoneId == null ||
    row?.nom == null;

  if (row && needsUpdate) {
    await db
      .update(user)
      .set({
        ...(row.role === "user" && expectedRole !== "user" && { role: expectedRole }),
        ...(row.zoneId == null && { zoneId }),
        ...(row.nom == null && nom && { nom }),
        updatedAt: new Date(),
      })
      .where(eq(user.email, email));
    return { role: expectedRole !== "user" ? expectedRole : row.role, nom, zoneId };
  }

  return { role: row?.role ?? "user", nom: row?.nom ?? nom, zoneId: row?.zoneId ?? zoneId };
}
