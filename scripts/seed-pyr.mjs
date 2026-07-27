/**
 * Seed script — PYR (Pyrénées)
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/seed-pyr.mjs
 *
 * Remplir le tableau RESOURCES avec les données des ressources PYR.
 * Structure identique aux scripts seed-naq.mjs et seed-hdf.mjs.
 *
 * Colonnes requises : nom, prenom, codePostal, ville, role, lat, lng
 * Rôles valides : CIR | Référent | TMF | TMRa | TMRe
 */

import pg from "pg";
const { Client } = pg;

const ZONE_ID = "PYR";

// ── À COMPLÉTER : ajouter les ressources ici ─────────────────────────────────
const RESOURCES = [
  // Exemple :
  // { nom: "DUPONT", prenom: "Jean", codePostal: "35000", ville: "Rennes", role: "CIR", lat: 48.1173, lng: -1.6778 },
];
// ─────────────────────────────────────────────────────────────────────────────

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

// Purge existing PYR resources before reinserting
const del = await client.query("DELETE FROM resources WHERE zone_id = $1", [ZONE_ID]);
console.log(`Purged ${del.rowCount} existing ${ZONE_ID} resources`);

let inserted = 0;
for (const r of RESOURCES) {
  const id = `${ZONE_ID}-${r.nom.replace(/\s+/g, "").toUpperCase()}-${r.prenom.replace(/\s+/g, "").toUpperCase()}`;
  await client.query(
    `INSERT INTO resources (id, zone_id, prenom, nom, ville, code_postal, role, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET prenom=$3, nom=$4, ville=$5, code_postal=$6, role=$7, lat=$8, lng=$9`,
    [id, ZONE_ID, r.prenom, r.nom, r.ville, r.codePostal, r.role, r.lat, r.lng]
  );
  inserted++;
}

console.log(`Inserted ${inserted} ${ZONE_ID} resources`);
await client.end();
