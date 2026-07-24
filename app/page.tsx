import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { syncUserRole } from "@/app/actions/syncUserRole";
import { isPrivilegedRole } from "@/lib/userRole";
import AppShell from "@/components/AppShell";
import AdminZoneOverlay from "@/components/AdminZoneOverlay";
import { ADMIN_EMAIL } from "@/lib/adminConfig";
import { getAdminSelectedZone, getZones } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export default async function Home() {
  // ── Auth guard ─────────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  // ── Admin flow ─────────────────────────────────────────────────────────────
  const isAdmin = session.user.email === ADMIN_EMAIL;

  if (isAdmin) {
    const [allZones, selectedZone] = await Promise.all([
      getZones(),
      getAdminSelectedZone(),
    ]);

    // Enrich with resource counts
    const counts = await db
      .select({ zoneId: resources.zoneId, cnt: sql<number>`count(*)::int` })
      .from(resources)
      .groupBy(resources.zoneId);
    const countMap = Object.fromEntries(counts.map((r) => [r.zoneId, r.cnt]));
    const zonesWithCount = allZones.map((z) => ({ ...z, resourceCount: countMap[z.id] ?? 0 }));

    if (!selectedZone) {
      // No zone chosen yet — show selection overlay on blank background
      return <AdminZoneOverlay zones={zonesWithCount} />;
    }

    // Zone chosen — render AppShell as that zone, with admin overlay available
    return (
      <AdminZoneOverlay zones={zonesWithCount} selectedZone={selectedZone}>
        <AppShell
          canManageRessources={true}
          currentUserNom={null}
          zoneId={selectedZone}
          isAdmin={true}
        />
      </AdminZoneOverlay>
    );
  }

  // ── Normal user flow ───────────────────────────────────────────────────────
  const { role, nom, zoneId } = await syncUserRole();
  const canManageRessources = isPrivilegedRole(role);

  return (
    <AppShell
      canManageRessources={canManageRessources}
      currentUserNom={nom}
      zoneId={zoneId}
    />
  );
}
