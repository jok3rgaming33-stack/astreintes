"use server";

import { db } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { ADMIN_EMAIL, ADMIN_ZONE_COOKIE } from "@/lib/adminConfig";

/** Returns true if the current session belongs to the admin account. */
export async function isAdminSession(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.email === ADMIN_EMAIL;
}

/** Returns all zones available in the DB. */
export async function getZones(): Promise<{ id: string; label: string }[]> {
  const rows = await db.select({ id: zones.id, label: zones.label }).from(zones).orderBy(zones.id);
  return rows;
}

/** Persists the admin's chosen zone in a session cookie. Server-action-only. */
export async function setAdminZone(zoneId: string): Promise<void> {
  const isAdmin = await isAdminSession();
  if (!isAdmin) throw new Error("Forbidden");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_ZONE_COOKIE, zoneId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // Session cookie — expires when browser closes
    maxAge: 60 * 60 * 8, // 8h max
  });
}

/** Reads the admin's currently selected zone from the cookie (server-side). */
export async function getAdminSelectedZone(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_ZONE_COOKIE)?.value ?? null;
}
