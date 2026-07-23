/**
 * Role-based access helpers.
 *
 * Profiles stored in the `role` column of the `user` table:
 *   "CIR"      → CIR (chargé d'intervention réseau)
 *   "Référent" → Référent
 *   "TMF"      → TMF
 *   "TMRa"     → TMRa
 *   "TMRe"     → TMRe
 *   "user"     → default (new account, no role set yet)
 *
 * Access rules:
 *   - canManageRessources : CIR | Référent only
 *   - canToggleOnCall     : all authenticated users
 *   - canToggleHoliday    : all authenticated users
 */

export type UserProfile = "CIR" | "Référent" | "TMF" | "TMRa" | "TMRe" | "user";

export interface AccessRights {
  canManageRessources: boolean;
  canToggleOnCall: boolean;
  canToggleHoliday: boolean;
  profile: UserProfile;
}

export function getAccessRights(role: string | null | undefined): AccessRights {
  const profile = (role ?? "user") as UserProfile;
  const isPrivileged = profile === "CIR" || profile === "Référent";

  return {
    profile,
    canManageRessources: isPrivileged,
    canToggleOnCall: true,
    canToggleHoliday: true,
  };
}

/** Returns true if the role is CIR or Référent (privileged profiles) */
export function isPrivilegedRole(role: string | null | undefined): boolean {
  return role === "CIR" || role === "Référent";
}
