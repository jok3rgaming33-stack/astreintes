import {
  pgTable,
  text,
  doublePrecision,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// Incident markers placed on the map (shared across all users)
export const incidents = pgTable("incidents", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Manual on-call / holiday overrides per person (keyed by nom)
export const personStatus = pgTable("person_status", {
  nom: text("nom").primaryKey(),
  isOnCall: boolean("is_on_call").notNull().default(false),
  isHoliday: boolean("is_holiday").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
