"use client";

import { useState, useCallback, useEffect } from "react";
import { PEOPLE, type Person } from "@/lib/people";

const STORAGE_KEY_CUSTOM = "astreintes_custom_people";
const STORAGE_KEY_REMOVED = "astreintes_removed_noms";

function loadCustom(): Person[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM) ?? "[]");
  } catch {
    return [];
  }
}

function loadRemoved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_REMOVED) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function usePeople() {
  const [customPeople, setCustomPeople] = useState<Person[]>([]);
  const [removedNoms, setRemovedNoms] = useState<Set<string>>(new Set());

  // Load from localStorage once on mount
  useEffect(() => {
    setCustomPeople(loadCustom());
    setRemovedNoms(loadRemoved());
  }, []);

  /** Combined list: base PEOPLE minus removed + custom additions */
  const people: Person[] = [
    ...PEOPLE.filter((p) => !removedNoms.has(`${p.prenom}|${p.nom}`)),
    ...customPeople,
  ];

  /** Add a new custom person */
  const addPerson = useCallback((person: Person) => {
    setCustomPeople((prev) => {
      const next = [...prev, person];
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next));
      return next;
    });
  }, []);

  /** Remove a person (either base or custom) by their unique key */
  const removePerson = useCallback((person: Person) => {
    const key = `${person.prenom}|${person.nom}`;
    const isCustom = customPeople.some(
      (p) => `${p.prenom}|${p.nom}` === key
    );

    if (isCustom) {
      setCustomPeople((prev) => {
        const next = prev.filter((p) => `${p.prenom}|${p.nom}` !== key);
        localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(next));
        return next;
      });
    } else {
      setRemovedNoms((prev) => {
        const next = new Set(prev);
        next.add(key);
        localStorage.setItem(STORAGE_KEY_REMOVED, JSON.stringify([...next]));
        return next;
      });
    }
  }, [customPeople]);

  /** Restore a removed base person */
  const restorePerson = useCallback((person: Person) => {
    const key = `${person.prenom}|${person.nom}`;
    setRemovedNoms((prev) => {
      const next = new Set(prev);
      next.delete(key);
      localStorage.setItem(STORAGE_KEY_REMOVED, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isRemoved = useCallback(
    (person: Person) => removedNoms.has(`${person.prenom}|${person.nom}`),
    [removedNoms]
  );

  const isCustom = useCallback(
    (person: Person) =>
      customPeople.some(
        (p) => `${p.prenom}|${p.nom}` === `${person.prenom}|${person.nom}`
      ),
    [customPeople]
  );

  return { people, addPerson, removePerson, restorePerson, isRemoved, isCustom, customPeople, removedNoms };
}
