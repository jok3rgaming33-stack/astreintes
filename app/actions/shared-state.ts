"use server";

import { db } from "@/lib/db";
import { incidents, personStatus, customPeople, removedPeople } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Person } from "@/lib/people";

// ── Incidents ──────────────────────────────────────────────────────────────

export async function getIncidents() {
  return db.select().from(incidents).orderBy(incidents.createdAt);
}

export async function addIncident(incident: {
  id: string;
  label: string;
  lat: number;
  lng: number;
}) {
  await db
    .insert(incidents)
    .values(incident)
    .onConflictDoNothing();
}

export async function removeIncident(id: string) {
  await db.delete(incidents).where(eq(incidents.id, id));
}

// ── Person status ──────────────────────────────────────────────────────────

export async function getPersonStatuses() {
  return db.select().from(personStatus);
}

export async function upsertPersonStatus(
  nom: string,
  updates: { isOnCall?: boolean; isHoliday?: boolean }
) {
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

export async function getCustomPeople(): Promise<Person[]> {
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
  await db.delete(customPeople).where(eq(customPeople.id, id));
}

export async function getRemovedKeys(): Promise<Set<string>> {
  const rows = await db.select().from(removedPeople);
  return new Set(rows.map((r) => r.key));
}

export async function addRemovedKey(key: string) {
  await db.insert(removedPeople).values({ key }).onConflictDoNothing();
}

export async function deleteRemovedKey(key: string) {
  await db.delete(removedPeople).where(eq(removedPeople.key, key));
}
