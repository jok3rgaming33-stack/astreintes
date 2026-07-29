import { betterAuth } from "better-auth";
import { pool } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
      const appName = "ORM Maintenance/Exploitation";
      await resend.emails.send({
        from: "noreply@resend.dev", // remplacer par votre domaine vérifié dans Resend
        to: user.email,
        subject: `[${appName}] Vérifiez votre adresse e-mail`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#0f172a;color:#e2e8f0;border-radius:12px;padding:32px;">
            <h2 style="color:#38bdf8;margin-top:0;">Bienvenue sur ${appName}</h2>
            <p style="line-height:1.6;">Votre compte a bien été créé. Pour finaliser votre inscription et accéder à l'application, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${url}" style="display:inline-block;background:#38bdf8;color:#0f172a;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;">
                Vérifier mon adresse e-mail
              </a>
            </div>
            <p style="font-size:12px;color:#64748b;line-height:1.6;">
              Si vous n'avez pas créé de compte, ignorez cet e-mail.<br/>
              Ce lien est valable 24 heures.
            </p>
            <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;"/>
            <p style="font-size:11px;color:#475569;margin:0;">${appName} — Iliad / Free</p>
          </div>
        `,
      });
    },
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // not settable from client signup directly
      },
      nom: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
    },
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
});
