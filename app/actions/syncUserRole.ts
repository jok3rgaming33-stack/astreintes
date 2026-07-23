"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

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

/**
 * Called server-side on the main page after login to ensure the role column
 * is synced from the email → role lookup table.
 * This handles accounts that were created before the role was set.
 */
export async function syncUserRole(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const email = session.user.email.toLowerCase();
  const expectedRole = EMAIL_TO_ROLE[email] ?? "user";

  // Only update if the stored role is still the default "user"
  // (avoids overwriting a manually-assigned role)
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
    return expectedRole;
  }

  return row?.role ?? "user";
}
