"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { EMAIL_TO_NOM, EMAIL_TO_ZONE, EMAIL_TO_ROLE } from "@/lib/emailToNom";

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
