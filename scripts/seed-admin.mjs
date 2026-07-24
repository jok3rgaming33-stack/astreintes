/**
 * Creates / updates the admin account using Better Auth's password hashing.
 * Safe to run multiple times (upsert on email).
 *
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/seed-admin.mjs
 */
import pg from "pg";
import { randomBytes, scrypt as _scrypt } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt);

/** Replicates Better Auth's password hashing exactly: salt:hexkey (scrypt N=16384 r=16 p=1 dkLen=64) */
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password.normalize("NFKC"), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${key.toString("hex")}`;
}

const { Client } = pg;

const ADMIN_EMAIL = "admin@admin.fr";
const ADMIN_NAME  = "Admin";
const ADMIN_PASS  = "admin1234";
const ADMIN_ROLE  = "CIR";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  // Hash password the same way Better Auth does
  const hash = await hashPassword(ADMIN_PASS);

  const userId = "admin-system";
  const now = new Date().toISOString();

  // Upsert user row (PK = id, unique on email)
  await client.query(`DELETE FROM "user" WHERE email = $1`, [ADMIN_EMAIL]);
  await client.query(
    `INSERT INTO "user" (id, name, email, "emailVerified", role, nom, zone_id, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, true, $4, 'ADMIN', NULL, $5, $5)`,
    [userId, ADMIN_NAME, ADMIN_EMAIL, ADMIN_ROLE, now]
  );

  // Upsert account row (credentials provider — PK = id)
  await client.query(`DELETE FROM account WHERE id = 'admin-account'`);
  await client.query(
    `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
     VALUES ('admin-account', $1, $2, 'credential', $3, $4, $4)`,
    [userId, ADMIN_EMAIL, hash, now]
  );

  console.log("[seed-admin] Admin account ready — email:", ADMIN_EMAIL);
  await client.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
