/**
 * Routing utility using the public OSRM API (router.project-osrm.org).
 * No API key required. Uses the car profile for road distances/durations.
 */

import { PEOPLE, type Person } from "@/lib/people";

export interface RouteResult {
  person: Person;
  distanceKm: number;
  durationMin: number;
  isOnCall: boolean;
}

/**
 * Fetch road distance + duration between two coordinates via OSRM table API.
 * Returns { distanceKm, durationMin } or null if the request fails.
 */
async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<{ distanceKm: number; durationMin: number } | null> {
  try {
    // OSRM route endpoint: /route/v1/driving/{lng1},{lat1};{lng2},{lat2}
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=false&geometries=polyline`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;

    const route = data.routes[0];
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}

/**
 * For a given incident location, computes road distance & duration from:
 * - all persons in onCallNoms (regardless of travel time)
 * - all other persons whose drive time is <= maxDurationMin (default 60 min)
 *
 * Persons are batched to avoid rate-limiting: requests are fired in parallel
 * but in groups of 5.
 */
export async function computeRouteResults(
  incidentLat: number,
  incidentLng: number,
  onCallNoms: Set<string>,
  holidayNoms: Set<string> = new Set(),
  maxDurationMin = 60
): Promise<RouteResult[]> {
  const results: RouteResult[] = [];

  // Persons on holiday are completely excluded from routing
  const eligible = PEOPLE.filter((p) => !holidayNoms.has(p.nom));

  // Process in batches of 5 to be polite to the free OSRM API
  const batchSize = 5;
  for (let i = 0; i < eligible.length; i += batchSize) {
    const batch = eligible.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map((person) =>
        fetchRoute(person.lat, person.lng, incidentLat, incidentLng).then(
          (route) => ({ person, route })
        )
      )
    );

    for (const result of settled) {
      if (result.status !== "fulfilled" || !result.value.route) continue;
      const { person, route } = result.value;
      const isOnCall = onCallNoms.has(person.nom);

      // Include if on-call OR within maxDurationMin
      if (isOnCall || route.durationMin <= maxDurationMin) {
        results.push({
          person,
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
          isOnCall,
        });
      }
    }

    // Small pause between batches
    if (i + batchSize < eligible.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  // Sort: on-call first, then by duration ascending
  results.sort((a, b) => {
    if (a.isOnCall !== b.isOnCall) return a.isOnCall ? -1 : 1;
    return a.durationMin - b.durationMin;
  });

  return results;
}
