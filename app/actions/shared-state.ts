"use server";

import { db } from "@/lib/db";
import { incidents, personStatus, resources, user, verification, zones } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import type { Person } from "@/lib/people";
import { EMAIL_TO_NOM } from "@/lib/emailToNom";
import { ADMIN_EMAIL, ADMIN_ZONE_COOKIE } from "@/lib/adminConfig";

// ── Auth helpers ───────────────────────────────────────────────────────────

/** Throws if no active session. Returns the session user with zoneId + role. */
async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  // Admin account: resolve zoneId from the session cookie, not the DB
  if (session.user.email === ADMIN_EMAIL) {
    const cookieStore = await cookies();
    const adminZone = cookieStore.get(ADMIN_ZONE_COOKIE)?.value ?? "NAQ";
    return {
      ...session.user,
      role: "CIR" as const,   // admin has full privileges
      zoneId: adminZone,
      nom: null as string | null,
    };
  }

  // Normal users: fetch the full user row to get zoneId
  const [row] = await db
    .select({ role: user.role, zoneId: user.zoneId, nom: user.nom })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return {
    ...session.user,
    role: row?.role ?? "user",
    zoneId: row?.zoneId ?? "NAQ",   // fallback to NAQ during migration
    nom: row?.nom ?? null,
  };
}

/** Throws if user is not CIR or Référent. Returns session identity. */
async function requireManager() {
  const u = await requireAuth();
  if (u.role !== "CIR" && u.role !== "Référent") {
    throw new Error("Forbidden: CIR or Référent role required");
  }
  return u;
}

// ── Incidents ──────────────────────────────────────────────────────────────

export async function getIncidents() {
  const u = await requireAuth();
  const rows = await db
    .select()
    .from(incidents)
    .where(u.zoneId === "ALL" ? isNotNull(incidents.zoneId) : eq(incidents.zoneId, u.zoneId))
    .orderBy(incidents.createdAt);
  // Return fields needed by NetworkIncident (createdAt as ISO string, addedBy)
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    lat: r.lat,
    lng: r.lng,
    addedBy: r.addedBy ?? "Inconnu",
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function addIncident(incident: {
  id: string;
  label: string;
  lat: number;
  lng: number;
}) {
  const u = await requireAuth();
  // Build display name: "Prénom NOM" from session name or nom fallback
  const addedBy = u.name ?? (u.nom ? u.nom : "Inconnu");
  await db
    .insert(incidents)
    .values({ ...incident, zoneId: u.zoneId, addedBy })
    .onConflictDoNothing();
}

export async function removeIncident(id: string) {
  const u = await requireAuth();
  await db
    .delete(incidents)
    .where(and(eq(incidents.id, id), eq(incidents.zoneId, u.zoneId)));
}

// ── Person status ──────────────────────────────────────────────────────────

export async function getPersonStatuses() {
  const u = await requireAuth();
  return db
    .select()
    .from(personStatus)
    .where(u.zoneId === "ALL" ? isNotNull(personStatus.zoneId) : eq(personStatus.zoneId, u.zoneId));
}

export async function upsertPersonStatus(
  nom: string,
  updates: { isOnCall?: boolean; isHoliday?: boolean }
) {
  const u = await requireAuth();
  const isManager = u.role === "CIR" || u.role === "Référent";

  // Non-managers can only update their own status
  if (!isManager) {
    const email = (u.email as string).toLowerCase();
    const ownNom = EMAIL_TO_NOM[email] ?? null;
    if (!ownNom || ownNom !== nom) {
      throw new Error("Forbidden: you can only update your own status");
    }
  }

  // PK is nom — upsert always writes zone_id so future reads can filter
  await db
    .insert(personStatus)
    .values({
      nom,
      zoneId: u.zoneId,
      isOnCall: updates.isOnCall ?? false,
      isHoliday: updates.isHoliday ?? false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: personStatus.nom,
      set: {
        zoneId: u.zoneId,
        ...(updates.isOnCall !== undefined && { isOnCall: updates.isOnCall }),
        ...(updates.isHoliday !== undefined && { isHoliday: updates.isHoliday }),
        updatedAt: new Date(),
      },
    });
}

// ── Resources (replaces custom_people + static PEOPLE) ────────────────────

export async function getResources(): Promise<Person[]> {
  const u = await requireAuth();
  const rows = await db
    .select()
    .from(resources)
    .where(u.zoneId === "ALL" ? isNotNull(resources.zoneId) : eq(resources.zoneId, u.zoneId))
    .orderBy(resources.nom);
  return rows.map((r) => ({
    id: r.id,
    prenom: r.prenom,
    nom: r.nom,
    ville: r.ville,
    codePostal: r.codePostal,
    role: r.role as Person["role"],
    lat: r.lat,
    lng: r.lng,
  }));
}

export async function addResource(person: Person) {
  const u = await requireManager();
  const id = person.id ?? `custom-${u.zoneId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await db
    .insert(resources)
    .values({
      id,
      zoneId: u.zoneId,
      prenom: person.prenom,
      nom: person.nom,
      ville: person.ville,
      codePostal: person.codePostal,
      role: person.role,
      lat: person.lat,
      lng: person.lng,
    })
    .onConflictDoNothing();
}

export async function deleteResource(id: string) {
  const u = await requireManager();
  await db
    .delete(resources)
    .where(and(eq(resources.id, id), eq(resources.zoneId, u.zoneId)));
}

/**
 * Révocation complète : supprime la ressource de la table resources ET
 * supprime le compte utilisateur associé (user + session + account).
 * La personne devra se réinscrire intégralement et reverifier son email.
 */
export async function revokeResource(id: string) {
  const u = await requireManager();

  // 1. Fetch the resource row to get nom (used to find the user account)
  const [resource] = await db
    .select({ nom: resources.nom, prenom: resources.prenom })
    .from(resources)
    .where(and(eq(resources.id, id), eq(resources.zoneId, u.zoneId)))
    .limit(1);

  if (!resource) throw new Error("Ressource introuvable");

  // 2. Delete the resource entry
  await db
    .delete(resources)
    .where(and(eq(resources.id, id), eq(resources.zoneId, u.zoneId)));

  // 3. Find and delete the associated user account (by nom + zoneId)
  const [linkedUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.nom, resource.nom), eq(user.zoneId, u.zoneId)))
    .limit(1);

  if (linkedUser) {
    // Clean up person status
    await db.delete(personStatus).where(eq(personStatus.nom, resource.nom));
    // Clean up pending email verification tokens for this user's email
    const [userRow] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, linkedUser.id))
      .limit(1);
    if (userRow?.email) {
      await db.delete(verification).where(eq(verification.identifier, userRow.email));
    }
    // session + account rows are CASCADE-deleted when user is deleted
    await db.delete(user).where(eq(user.id, linkedUser.id));
  }

  return { revoked: true, nom: resource.nom, prenom: resource.prenom };
}

export async function updateResource(
  id: string,
  updates: { role?: string; ville?: string; codePostal?: string; lat?: number; lng?: number }
) {
  const u = await requireManager();
  await db
    .update(resources)
    .set({
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.ville !== undefined && { ville: updates.ville }),
      ...(updates.codePostal !== undefined && { codePostal: updates.codePostal }),
      ...(updates.lat !== undefined && { lat: updates.lat }),
      ...(updates.lng !== undefined && { lng: updates.lng }),
    })
    .where(and(eq(resources.id, id), eq(resources.zoneId, u.zoneId)));

  // Propagate role change to user table
  if (updates.role !== undefined) {
    const [profile] = await db
      .select({ nom: resources.nom })
      .from(resources)
      .where(eq(resources.id, id))
      .limit(1);
    if (profile?.nom) {
      await db
        .update(user)
        .set({ role: updates.role, updatedAt: new Date() })
        .where(and(eq(user.nom, profile.nom), eq(user.zoneId, u.zoneId)));
    }
  }
}

// ── Zones ──────────────────────────────────────────────────────────────────

export async function getZones() {
  return db.select().from(zones).orderBy(zones.label);
}
