import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, resources } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { EMAIL_TO_NOM } from "@/lib/emailToNom";

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

    // 1. Find the nom from the email directory (EMAIL_TO_NOM maps email → nom string)
    const nom = EMAIL_TO_NOM[email];
    if (!nom) {
      return NextResponse.json(
        { error: "Adresse e-mail non reconnue dans l'annuaire." },
        { status: 404 }
      );
    }

    // 2. Find the matching resource row by nom
    const [resource] = await db
      .select({ codePostal: resources.codePostal })
      .from(resources)
      .where(eq(resources.nom, nom))
      .limit(1);

    if (!resource) {
      return NextResponse.json(
        { error: "Ressource introuvable. Contactez votre administrateur." },
        { status: 404 }
      );
    }

    // 3. Compare postal codes (normalise to 5-digit string)
    const storedCP = (resource.codePostal ?? "").trim();
    if (storedCP !== codePostal) {
      return NextResponse.json(
        { error: "Code postal incorrect." },
        { status: 400 }
      );
    }

    // 4. Mark the user account as verified
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
