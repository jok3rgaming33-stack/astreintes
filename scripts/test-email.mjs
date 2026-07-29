/**
 * Script de test d'envoi d'email via Resend.
 *
 * Usage :
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/test-email.mjs votre@email.fr
 *
 * Ce script envoie un email identique à celui de la vérification de compte,
 * avec un lien fictif, directement à l'adresse passée en argument.
 */

import { Resend } from "resend";

const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/test-email.mjs <adresse@destinataire.fr>");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY manquante. Assurez-vous que le fichier .env est chargé.");
  process.exit(1);
}

const resend = new Resend(apiKey);

const APP_NAME = "ORM Maintenance/Exploitation";
const FAKE_VERIFY_URL = "https://example.com/verify-email?token=TEST_TOKEN_123";

// ─── Paramètres à modifier ────────────────────────────────────────────────────
const FROM = "noreply@resend.dev"; // <- remplacer par votre domaine vérifié dans Resend
const SUBJECT = `[${APP_NAME}] Vérifiez votre adresse e-mail`;
// ─────────────────────────────────────────────────────────────────────────────

const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;padding:32px;">
    <h2 style="color:#38bdf8;margin-top:0;">Bienvenue sur ${APP_NAME}</h2>
    <p style="line-height:1.6;">
      Votre compte a bien été créé. Pour finaliser votre inscription et accéder à l'application,
      veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a
        href="${FAKE_VERIFY_URL}"
        style="display:inline-block;background:#38bdf8;color:#0f172a;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;"
      >
        Vérifier mon adresse e-mail
      </a>
    </div>
    <p style="font-size:12px;color:#64748b;line-height:1.6;">
      Si vous n'avez pas créé de compte, ignorez cet e-mail.<br/>
      Ce lien est valable 24 heures.
    </p>
    <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;"/>
    <p style="font-size:11px;color:#475569;margin:0;">${APP_NAME} — Iliad / Free</p>
  </div>
`;

console.log(`\nEnvoi d'un email de test...`);
console.log(`  De      : ${FROM}`);
console.log(`  A       : ${to}`);
console.log(`  Sujet   : ${SUBJECT}`);
console.log(`  API key : ${apiKey.slice(0, 8)}...\n`);

const { data, error } = await resend.emails.send({ from: FROM, to, subject: SUBJECT, html });

if (error) {
  console.error("Echec de l'envoi :", error);
  process.exit(1);
}

console.log("Email envoyé avec succès.");
console.log("ID Resend :", data?.id);
console.log("\nVerifiez votre boite mail (et le dossier spam si absent).");
