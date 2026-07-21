"use server";

import { db } from "@/lib/db";
import { incidents, personStatus } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
