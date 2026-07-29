import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body.email ?? "").trim().toLowerCase();
    const codePostal: string = (body.codePostal ?? "").trim();

    if (!email || !codePostal) {
      return NextResponse.json(
        { error: "Email et code postal requis." },
        { status: 400 }
      );
    }

    // Look up the stored verification code on the user row
    const [row] = await db
      .select({ codePostal: user.codePostal, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "Compte introuvable." },
        { status: 404 }
      );
    }

    if (row.emailVerified) {
      // Already verified — just let them sign in
      return NextResponse.json({ ok: true });
    }

    if (!row.codePostal) {
      // storeVerificationCode was never called — resource likely not added yet
      return NextResponse.json(
        { error: "Votre fiche n'a pas encore été créée par l'administrateur. Contactez-le avant de vous inscrire." },
        { status: 404 }
      );
    }

    if (row.codePostal.trim() !== codePostal) {
      return NextResponse.json(
        { error: "Code postal incorrect." },
        { status: 400 }
      );
    }

    // Mark account as verified
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, email));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[verify-postal] error:", err);
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
