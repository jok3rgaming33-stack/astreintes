"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface SignalPoint {
  lat: number;
  lng: number;
  label: string;
}

interface AddressSearchProps {
  onSignal: (point: SignalPoint) => void;
  onClickModeChange: (active: boolean) => void;
  clickModeActive: boolean;
}

export default function AddressSearch({
  onSignal,
  onClickModeChange,
  clickModeActive,
}: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (value: string) => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&countrycodes=fr`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  };

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name);
    setOpen(false);
    setSuggestions([]);
    onSignal({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      label: result.display_name,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) handleSelect(suggestions[0]);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSignal({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Ma position",
        });
        setQuery("Ma position");
      },
      () => {
        alert("Impossible d'obtenir votre position.");
      }
    );
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="px-4 py-3"
      style={{ borderBottom: "1px solid var(--color-border)" }}
      ref={wrapperRef}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-secondary)" }}>
        Signaler un probleme WiFi
      </p>

      {/* Address input */}
      <form onSubmit={handleSubmit} className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-text-primary)" }}
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          type="text"
          placeholder="Saisir une adresse..."
          value={query}
          onChange={handleChange}
          className="w-full pl-9 pr-8 py-2 rounded-lg text-sm outline-none transition-colors"
          style={{
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
            />
          </div>
        )}

        {/* Dropdown suggestions */}
        {open && suggestions.length > 0 && (
          <ul
            className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg overflow-hidden shadow-xl"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelect(s)}
                  className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/10 truncate"
                  style={{ color: "var(--color-text-primary)" }}
                  title={s.display_name}
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Ma position + Click mode */}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={handleGeolocate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center"
          style={{
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          {/* crosshair icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
          Ma position
        </button>

        <button
          type="button"
          onClick={() => onClickModeChange(!clickModeActive)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center"
          style={{
            background: clickModeActive ? "rgba(239,68,68,0.18)" : "var(--color-surface-elevated)",
            border: `1px solid ${clickModeActive ? "#ef4444" : "var(--color-border)"}`,
            color: clickModeActive ? "#ef4444" : "var(--color-text-secondary)",
          }}
        >
          {/* map pin icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {clickModeActive ? "Clic actif" : "Clic sur carte"}
        </button>
      </div>

      {clickModeActive && (
        <p className="mt-2 text-xs text-center" style={{ color: "#ef4444", opacity: 0.85 }}>
          Cliquez sur la carte pour placer le signal
        </p>
      )}
    </div>
  );
}
