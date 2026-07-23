import {
  pgTable,
  text,
  doublePrecision,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// ── Zones (one per secto) ─────────────────────────────────────────────────────
export const zones = pgTable("zones", {
  id: text("id").primaryKey(),           // e.g. "NAQ"
  label: text("label").notNull(),        // e.g. "Nouvelle-Aquitaine"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Better Auth required tables ──────────────────────────────────────────────
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // App-specific: profile role (CIR / Référent / TMF / TMRa / TMRe)
  role: text("role").notNull().default("user"),
  // App-specific: nom linking to resources table (e.g. "FAYOL")
  nom: text("nom"),
  // App-specific: zone this user belongs to
  zoneId: text("zone_id").references(() => zones.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// ── App tables ────────────────────────────────────────────────────────────────

// ── Resources (replaces static people.ts + custom_people) ────────────────────
export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  zoneId: text("zone_id").notNull().references(() => zones.id, { onDelete: "cascade" }),
  prenom: text("prenom").notNull(),
  nom: text("nom").notNull(),
  ville: text("ville").notNull(),
  codePostal: text("code_postal").notNull(),
  role: text("role").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Incident markers ──────────────────────────────────────────────────────────
export const incidents = pgTable("incidents", {
  id: text("id").primaryKey(),
  zoneId: text("zone_id").references(() => zones.id),
  label: text("label").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── On-call / holiday status (keyed by resource nom + zone) ──────────────────
export const personStatus = pgTable("person_status", {
  nom: text("nom").primaryKey(),
  zoneId: text("zone_id").references(() => zones.id),
  isOnCall: boolean("is_on_call").notNull().default(false),
  isHoliday: boolean("is_holiday").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Legacy tables (kept during transition, will be dropped after NAQ seed) ───
export const customPeople = pgTable("custom_people", {
  id: text("id").primaryKey(),
  prenom: text("prenom").notNull(),
  nom: text("nom").notNull(),
  ville: text("ville").notNull(),
  codePostal: text("code_postal").notNull(),
  role: text("role").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const removedPeople = pgTable("removed_people", {
  key: text("key").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
