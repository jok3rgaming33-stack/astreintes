"use client";

import { useState, useRef, useCallback } from "react";

export interface NetworkIncident {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** ISO string — set by the server when the incident is persisted */
  createdAt?: string;
  /** Nom + prénom of the user who added the incident */
  addedBy?: string;
}

interface AddressSearchProps {
  onAddIncident: (incident: NetworkIncident) => void;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    postcode?: string;
  };
}

/** Extract a human-readable primary line and secondary line from a Nominatim result */
function parseSuggestion(result: NominatimResult): { primary: string; secondary: string } {
  const addr = result.address;
  if (addr) {
    const parts: string[] = [];
    if (addr.house_number) parts.push(addr.house_number);
    if (addr.road) parts.push(addr.road);
    const primary = parts.length > 0 ? parts.join(" ") : result.display_name.split(",")[0].trim();

    const cityName =
      addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
    const secondary = [addr.postcode, cityName].filter(Boolean).join(" ");

    return { primary: primary || result.display_name.split(",")[0], secondary };
  }
  // fallback: split display_name by comma
  const segments = result.display_name.split(",").map((s) => s.trim());
  return {
    primary: segments[0],
    secondary: segments.slice(1, 3).join(", "),
  };
}

export default function AddressSearch({ onAddIncident }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=fr&addressdetails=1&q=${encodeURIComponent(value)}`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
    } catch {
      setError("Erreur lors de la recherche d'adresse.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    const { primary, secondary } = parseSuggestion(result);
    const label = secondary ? `${primary}, ${secondary}` : primary;
    const incident: NetworkIncident = {
      id: `addr-${Date.now()}`,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      label,
    };
    onAddIncident(incident);
    setQuery(primary);
    setSuggestions([]);
    setError(null);
  };

  const handleMyPosition = () => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "fr" } }
          );
          const data: NominatimResult = await res.json();
          if (data.display_name) {
            const { primary, secondary } = parseSuggestion(data);
            label = secondary ? `${primary}, ${secondary}` : primary;
          }
        } catch {
          // use raw coords as fallback
        }
        const incident: NetworkIncident = {
          id: `geo-${Date.now()}`,
          lat: latitude,
          lng: longitude,
          label,
        };
        onAddIncident(incident);
        setQuery(label.split(",")[0]);
        setGeoLoading(false);
        setSuggestions([]);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === 1) {
          setError("Accès à la position refusé. Vérifiez les permissions du navigateur.");
        } else {
          setError("Impossible d'obtenir votre position.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Address input */}
      <div className="relative">
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Adresse ou lieu de la panne…"
            value={query}
            onChange={handleChange}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
            autoComplete="off"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ color: "var(--color-accent)" }}
              >
                <path d="M21 12a9 9 0 1 1-9-9" />
              </svg>
            </span>
          )}
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul
            className="absolute left-0 right-0 top-full mt-1 z-[2000] rounded-lg overflow-hidden"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          >
            {suggestions.map((s, i) => {
              const { primary, secondary } = parseSuggestion(s);
              return (
                <li key={i}>
                  <button
                    className="w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-white/10 flex flex-col gap-0.5"
                    style={{ color: "var(--color-text-primary)" }}
                    onClick={() => handleSelect(s)}
                  >
                    <span className="font-semibold text-sm leading-tight">{primary}</span>
                    {secondary && (
                      <span className="opacity-50 truncate">{secondary}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* My position button */}
      <button
        onClick={handleMyPosition}
        disabled={geoLoading}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)",
        }}
      >
        {geoLoading ? (
          <svg
            className="animate-spin flex-shrink-0"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ color: "var(--color-accent)" }}
          >
            <path d="M21 12a9 9 0 1 1-9-9" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
          </svg>
        )}
        {geoLoading ? "Localisation…" : "Ma position (si adresse non répertoriée)"}
      </button>

      {error && (
        <p className="text-xs px-1" style={{ color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
