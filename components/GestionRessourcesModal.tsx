"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PEOPLE,
  ROLE_COLORS,
  ROLE_LABELS,
  type Person,
  type Role,
} from "@/lib/people";

const ALL_ROLES: Role[] = ["CIR", "REF", "TMF", "TMRa", "TMRe"];

interface GestionRessourcesModalProps {
  open: boolean;
  onClose: () => void;
  people: Person[];
  onAdd: (person: Person) => void;
  onRemove: (person: Person) => void;
  onRestore: (person: Person) => void;
  onUpdate: (person: Person, updates: { role?: Role; ville?: string; codePostal?: string; lat?: number; lng?: number }) => Promise<void>;
  isRemoved: (person: Person) => boolean;
  isCustom: (person: Person) => boolean;
}

const EMPTY_FORM = {
  prenom: "",
  nom: "",
  ville: "",
  codePostal: "",
  role: "TMRe" as Role,
};

type EditForm = {
  role: Role;
  ville: string;
  codePostal: string;
  lat?: number;
  lng?: number;
};

export default function GestionRessourcesModal({
  open,
  onClose,
  people,
  onAdd,
  onRemove,
  onRestore,
  onUpdate,
  isRemoved,
  isCustom,
}: GestionRessourcesModalProps) {
  const [tab, setTab] = useState<"list" | "add">("list");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Person | null>(null);

  // ── Edit state ──────────────────────────────────────────────────────────
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ role: "TMRe", ville: "", codePostal: "" });
  const [editGeocoding, setEditGeocoding] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (person: Person) => {
    setEditingPerson(person);
    setEditForm({ role: person.role, ville: person.ville, codePostal: person.codePostal, lat: person.lat, lng: person.lng });
    setEditError("");
  };

  const closeEdit = () => {
    setEditingPerson(null);
    setEditError("");
  };

  const handleEditGeocode = useCallback(async () => {
    setEditError("");
    if (!editForm.ville && !editForm.codePostal) {
      setEditError("Renseignez une ville ou un code postal.");
      return;
    }
    setEditGeocoding(true);
    try {
      const query = encodeURIComponent(`${editForm.ville} ${editForm.codePostal} France`.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=fr`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setEditError("Localisation non trouvée. Vérifiez la ville / code postal.");
        return;
      }
      const { lat, lon, address } = data[0];
      const detectedVille = address?.city || address?.town || address?.village || editForm.ville;
      setEditForm((f) => ({ ...f, ville: detectedVille, lat: parseFloat(lat), lng: parseFloat(lon) }));
      setEditError("");
    } catch {
      setEditError("Erreur de géolocalisation. Réessayez.");
    } finally {
      setEditGeocoding(false);
    }
  }, [editForm.ville, editForm.codePostal]);

  const handleEditSave = useCallback(async () => {
    if (!editingPerson) return;
    setEditError("");
    if (!editForm.ville.trim() || !editForm.codePostal.trim()) {
      setEditError("Ville et code postal sont obligatoires.");
      return;
    }

    // Auto-geocode if address changed but coords not refreshed
    let { lat, lng } = editForm;
    if (!lat || !lng || editForm.ville !== editingPerson.ville || editForm.codePostal !== editingPerson.codePostal) {
      setEditGeocoding(true);
      try {
        const query = encodeURIComponent(`${editForm.ville} ${editForm.codePostal} France`.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=fr`,
          { headers: { "Accept-Language": "fr" } }
        );
        const data = await res.json();
        if (data.length === 0) {
          setEditError("Impossible de localiser cette adresse.");
          setEditGeocoding(false);
          return;
        }
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      } catch {
        setEditError("Erreur de géolocalisation.");
        setEditGeocoding(false);
        return;
      }
      setEditGeocoding(false);
    }

    setEditSaving(true);
    try {
      await onUpdate(editingPerson, {
        role: editForm.role,
        ville: editForm.ville.trim(),
        codePostal: editForm.codePostal.trim(),
        lat,
        lng,
      });
      closeEdit();
      setAddSuccess(`${editingPerson.prenom} ${editingPerson.nom} mis à jour.`);
      setTimeout(() => setAddSuccess(""), 3000);
    } catch {
      setEditError("Erreur lors de la sauvegarde.");
    } finally {
      setEditSaving(false);
    }
  }, [editingPerson, editForm, onUpdate]);

  // ── List ────────────────────────────────────────────────────────────────
  const filteredList = useMemo(() => {
    const q = search.toLowerCase();
    const all = [
      ...PEOPLE,
      ...people.filter((p) => isCustom(p)),
    ];
    const seen = new Set<string>();
    return all.filter((p) => {
      const key = `${p.prenom}|${p.nom}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return (
        q === "" ||
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        p.ville.toLowerCase().includes(q)
      );
    });
  }, [search, people, isCustom]);

  // ── Add form ─────────────────────────────────────────────────────────────
  const handleGeocode = useCallback(async () => {
    setGeocodeError("");
    if (!form.ville && !form.codePostal) {
      setGeocodeError("Renseignez une ville ou un code postal.");
      return;
    }
    setGeocoding(true);
    try {
      const query = encodeURIComponent(`${form.ville} ${form.codePostal} France`.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=fr`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setGeocodeError("Localisation non trouvée. Vérifiez la ville / code postal.");
        return;
      }
      const { lat, lon, address } = data[0];
      const detectedVille = address?.city || address?.town || address?.village || form.ville;
      setForm((f) => ({ ...f, ville: detectedVille, lat: parseFloat(lat), lng: parseFloat(lon) } as typeof f & { lat: number; lng: number }));
      setGeocodeError("");
    } catch {
      setGeocodeError("Erreur de géolocalisation. Réessayez.");
    } finally {
      setGeocoding(false);
    }
  }, [form.ville, form.codePostal]);

  const handleSubmit = useCallback(async () => {
    setGeocodeError("");
    if (!form.prenom.trim() || !form.nom.trim()) {
      setGeocodeError("Prénom et nom sont obligatoires.");
      return;
    }
    if (!form.ville.trim() || !form.codePostal.trim()) {
      setGeocodeError("Ville et code postal sont obligatoires.");
      return;
    }
    const formWithCoords = form as typeof form & { lat?: number; lng?: number };
    if (!formWithCoords.lat || !formWithCoords.lng) {
      setGeocoding(true);
      try {
        const query = encodeURIComponent(`${form.ville} ${form.codePostal} France`.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=fr`,
          { headers: { "Accept-Language": "fr" } }
        );
        const data = await res.json();
        if (data.length === 0) {
          setGeocodeError("Impossible de localiser cette adresse.");
          setGeocoding(false);
          return;
        }
        formWithCoords.lat = parseFloat(data[0].lat);
        formWithCoords.lng = parseFloat(data[0].lon);
      } catch {
        setGeocodeError("Erreur de géolocalisation.");
        setGeocoding(false);
        return;
      }
      setGeocoding(false);
    }
    const newPerson: Person = {
      prenom: form.prenom.trim(),
      nom: form.nom.trim().toUpperCase(),
      ville: form.ville.trim(),
      codePostal: form.codePostal.trim(),
      role: form.role,
      lat: formWithCoords.lat!,
      lng: formWithCoords.lng!,
    };
    onAdd(newPerson);
    setForm({ ...EMPTY_FORM });
    setAddSuccess(`${newPerson.prenom} ${newPerson.nom} ajouté·e avec succès.`);
    setTimeout(() => setAddSuccess(""), 3000);
    setTab("list");
  }, [form, onAdd]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[3100] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col rounded-2xl shadow-2xl w-full overflow-hidden"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          maxWidth: "500px",
          height: "min(92dvh, 740px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                Gestion des ressources
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {people.length} ressource{people.length > 1 ? "s" : ""} actives
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex-shrink-0 flex gap-1 px-4 py-2"
          style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}
        >
          {(["list", "add"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setGeocodeError(""); closeEdit(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t ? "var(--color-accent)" : "transparent",
                color: tab === t ? "#fff" : "var(--color-text-secondary)",
              }}
            >
              {t === "list" ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  Liste des ressources
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  Ajouter une ressource
                </>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: List ── */}
        {tab === "list" && (
          <>
            {addSuccess && (
              <div className="flex-shrink-0 mx-4 mt-3 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e" }}>
                {addSuccess}
              </div>
            )}
            <div className="flex-shrink-0 px-4 pt-3 pb-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-text-primary)" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-1.5">
                {filteredList.map((person) => {
                  const removed = isRemoved(person);
                  const custom = isCustom(person);
                  const color = ROLE_COLORS[person.role];
                  const initials = `${person.prenom[0]}${person.nom.slice(0, 2)}`.toUpperCase();
                  const isEditing = editingPerson?.prenom === person.prenom && editingPerson?.nom === person.nom;

                  return (
                    <div
                      key={`${person.prenom}|${person.nom}`}
                      className="flex flex-col rounded-xl overflow-hidden transition-all"
                      style={{
                        background: removed ? "rgba(239,68,68,0.06)" : "var(--color-surface-elevated)",
                        border: `1px solid ${isEditing ? "var(--color-accent)" : removed ? "rgba(239,68,68,0.25)" : "var(--color-border)"}`,
                        opacity: removed ? 0.6 : 1,
                      }}
                    >
                      {/* Row */}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        {/* Avatar */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: removed ? "#6b7280" : color }}
                        >
                          {initials}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                              {person.prenom} {person.nom}
                            </p>
                            {custom && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(59,130,246,0.15)", color: "var(--color-accent)" }}>
                                personnalisé
                              </span>
                            )}
                            {removed && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                                supprimé
                              </span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {person.ville} · <span className="font-semibold" style={{ color }}>{ROLE_LABELS[person.role]}</span>
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {removed ? (
                            <button
                              onClick={() => onRestore(person)}
                              title="Rétablir cette ressource"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                              </svg>
                              Rétablir
                            </button>
                          ) : (
                            <>
                              {/* Edit button — only for custom people */}
                              {custom && (
                                <button
                                  onClick={() => isEditing ? closeEdit() : openEdit(person)}
                                  title={isEditing ? "Fermer l'édition" : "Modifier ce profil"}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-500/20"
                                  style={{
                                    border: `1px solid ${isEditing ? "var(--color-accent)" : "var(--color-border)"}`,
                                    color: isEditing ? "var(--color-accent)" : "var(--color-text-secondary)",
                                  }}
                                >
                                  {isEditing ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                  ) : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                  )}
                                </button>
                              )}
                              {/* Delete button */}
                              <button
                                onClick={() => setConfirmDelete(person)}
                                title="Supprimer cette ressource"
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                                style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* ── Inline edit drawer ── */}
                      {isEditing && (
                        <div
                          className="px-4 pb-4 pt-1 flex flex-col gap-3"
                          style={{ borderTop: "1px solid var(--color-border)" }}
                        >
                          {/* Role selector */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Poste</label>
                            <div className="flex flex-wrap gap-1.5">
                              {ALL_ROLES.map((r) => (
                                <button
                                  key={r}
                                  onClick={() => setEditForm((f) => ({ ...f, role: r }))}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                                  style={{
                                    background: editForm.role === r ? `${ROLE_COLORS[r]}22` : "var(--color-surface)",
                                    border: `1px solid ${editForm.role === r ? ROLE_COLORS[r] : "var(--color-border)"}`,
                                    color: editForm.role === r ? ROLE_COLORS[r] : "var(--color-text-secondary)",
                                  }}
                                >
                                  {ROLE_LABELS[r]}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Ville / CP */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Ville</label>
                              <input
                                type="text"
                                value={editForm.ville}
                                onChange={(e) => setEditForm((f) => ({ ...f, ville: e.target.value, lat: undefined, lng: undefined }))}
                                className="px-3 py-2 rounded-lg text-xs outline-none"
                                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Code postal</label>
                              <input
                                type="text"
                                value={editForm.codePostal}
                                onChange={(e) => setEditForm((f) => ({ ...f, codePostal: e.target.value, lat: undefined, lng: undefined }))}
                                className="px-3 py-2 rounded-lg text-xs outline-none"
                                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                              />
                            </div>
                          </div>

                          {/* Coords feedback */}
                          {editForm.lat ? (
                            <div className="px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
                              Position : {editForm.lat.toFixed(4)}, {editForm.lng?.toFixed(4)}
                            </div>
                          ) : (
                            <button
                              onClick={handleEditGeocode}
                              disabled={editGeocoding}
                              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{
                                background: "var(--color-surface)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-secondary)",
                                opacity: editGeocoding ? 0.6 : 1,
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 12-8 12S4 15.25 4 10a8 8 0 0 1 8-8z"/>
                              </svg>
                              {editGeocoding ? "Géolocalisation…" : "Vérifier la position"}
                            </button>
                          )}

                          {editError && (
                            <p className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                              {editError}
                            </p>
                          )}

                          {/* Save / Cancel */}
                          <div className="flex gap-2">
                            <button
                              onClick={closeEdit}
                              className="flex-1 py-2 rounded-lg text-xs font-semibold"
                              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                            >
                              Annuler
                            </button>
                            <button
                              onClick={handleEditSave}
                              disabled={editSaving || editGeocoding}
                              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                              style={{
                                background: "var(--color-accent)",
                                color: "#fff",
                                opacity: (editSaving || editGeocoding) ? 0.6 : 1,
                              }}
                            >
                              {editSaving ? "Sauvegarde…" : "Enregistrer"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Tab: Add ── */}
        {tab === "add" && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="flex flex-col gap-4">
              {/* Prenom / Nom */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Prénom *</label>
                  <input type="text" placeholder="Prénom" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Nom *</label>
                  <input type="text" placeholder="NOM" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
              </div>
              {/* Ville / CP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Ville *</label>
                  <input type="text" placeholder="Bordeaux" value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value, lat: undefined, lng: undefined } as typeof f))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Code postal *</label>
                  <input type="text" placeholder="33000" value={form.codePostal} onChange={(e) => setForm((f) => ({ ...f, codePostal: e.target.value, lat: undefined, lng: undefined } as typeof f))} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
              </div>
              {/* Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>Rôle *</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => (
                    <button key={r} onClick={() => setForm((f) => ({ ...f, role: r }))} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: form.role === r ? `${ROLE_COLORS[r]}22` : "var(--color-surface-elevated)", border: `1px solid ${form.role === r ? ROLE_COLORS[r] : "var(--color-border)"}`, color: form.role === r ? ROLE_COLORS[r] : "var(--color-text-secondary)" }}>
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Geocode */}
              {(form as typeof form & { lat?: number }).lat ? (
                <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
                  Position détectée : {(form as typeof form & { lat?: number; lng?: number }).lat?.toFixed(4)}, {(form as typeof form & { lat?: number; lng?: number }).lng?.toFixed(4)}
                </div>
              ) : (
                <button onClick={handleGeocode} disabled={geocoding} className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", opacity: geocoding ? 0.6 : 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 5.25-8 12-8 12S4 15.25 4 10a8 8 0 0 1 8-8z"/></svg>
                  {geocoding ? "Géolocalisation…" : "Vérifier la position"}
                </button>
              )}
              {geocodeError && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
                  {geocodeError}
                </p>
              )}
              <button onClick={handleSubmit} disabled={geocoding} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]" style={{ background: "var(--color-accent)", color: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.3)", opacity: geocoding ? 0.6 : 1 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                Ajouter la ressource
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm delete dialog ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[3200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="flex flex-col gap-4 rounded-2xl p-6 shadow-2xl w-full" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxWidth: "340px" }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                  Supprimer {confirmDelete.prenom} {confirmDelete.nom} ?
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Cette ressource ne sera plus visible sur la carte ni dans les effectifs. Vous pourrez la rétablir à tout moment.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                Annuler
              </button>
              <button onClick={() => { onRemove(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#ef4444", color: "#fff" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
