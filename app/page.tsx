import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { syncUserRole } from "@/app/actions/syncUserRole";
import { isPrivilegedRole } from "@/lib/userRole";
import AppShell from "@/components/AppShell";

export default async function Home() {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  // ── Role sync ──────────────────────────────────────────────────────────────
  // Ensures the role column is populated from the email→role lookup table
  // the first time a user logs in (Better Auth sets role to "user" by default).
  const { role, nom } = await syncUserRole();

  const canManageRessources = isPrivilegedRole(role);

  return (
    <AppShell
      canManageRessources={canManageRessources}
      currentUserNom={nom}
    />
  );
}
