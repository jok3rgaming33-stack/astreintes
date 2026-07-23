"use server";

import { db } from "@/lib/db";
import { incidents, personStatus, customPeople, removedPeople } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Person } from "@/lib/people";

// ── Auth helpers ───────────────────────────────────────────────────────────

/** Throws if no active session. Returns the session user. */
async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

/** Throws if user is not CIR or Référent. */
async function requireManager() {
  const user = await requireAuth();
  const role = (user as { role?: string }).role ?? "";
  if (role !== "CIR" && role !== "Référent") {
    throw new Error("Forbidden: CIR or Référent role required");
  }
  return user;
}

// ── Incidents ──────────────────────────────────────────────────────────────

export async function getIncidents() {
  await requireAuth();
  return db.select().from(incidents).orderBy(incidents.createdAt);
}

export async function addIncident(incident: {
  id: string;
  label: string;
  lat: number;
  lng: number;
}) {
  await requireAuth();
  await db.insert(incidents).values(incident).onConflictDoNothing();
}

export async function removeIncident(id: string) {
  await requireAuth();
  await db.delete(incidents).where(eq(incidents.id, id));
}

// ── Person status ──────────────────────────────────────────────────────────
// All authenticated users can read and update statuses (on-call / holiday).

export async function getPersonStatuses() {
  await requireAuth();
  return db.select().from(personStatus);
}

export async function upsertPersonStatus(
  nom: string,
  updates: { isOnCall?: boolean; isHoliday?: boolean }
) {
  await requireAuth();
  await db
    .insert(personStatus)
    .values({
      nom,
      isOnCall: updates.isOnCall ?? false,
      isHoliday: updates.isHoliday ?? false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: personStatus.nom,
      set: {
        ...(updates.isOnCall !== undefined && { isOnCall: updates.isOnCall }),
        ...(updates.isHoliday !== undefined && { isHoliday: updates.isHoliday }),
        updatedAt: new Date(),
      },
    });
}

// ── Custom / removed people ────────────────────────────────────────────────
// Read: all authenticated users. Write: CIR / Référents only.

export async function getCustomPeople(): Promise<Person[]> {
  await requireAuth();
  const rows = await db.select().from(customPeople).orderBy(customPeople.createdAt);
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

export async function addCustomPerson(person: Person) {
  await requireManager();
  await db
    .insert(customPeople)
    .values({
      id: person.id ?? `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

export async function deleteCustomPerson(id: string) {
  await requireManager();
  await db.delete(customPeople).where(eq(customPeople.id, id));
}

export async function getRemovedKeys(): Promise<Set<string>> {
  await requireAuth();
  const rows = await db.select().from(removedPeople);
  return new Set(rows.map((r) => r.key));
}

export async function addRemovedKey(key: string) {
  await requireManager();
  await db.insert(removedPeople).values({ key }).onConflictDoNothing();
}

export async function deleteRemovedKey(key: string) {
  await requireManager();
  await db.delete(removedPeople).where(eq(removedPeople.key, key));
}
