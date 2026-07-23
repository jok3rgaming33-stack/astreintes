"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { PEOPLE, type Person } from "@/lib/people";
import {
  getCustomPeople,
  getRemovedKeys,
  addCustomPerson,
  deleteCustomPerson,
  addRemovedKey,
  deleteRemovedKey,
  updatePersonProfile,
} from "@/app/actions/shared-state";

const POLL_INTERVAL_MS = 5000;

// SWR fetchers (server actions are async functions — usable directly)
const fetchCustom = () => getCustomPeople();
const fetchRemoved = () => getRemovedKeys();

export function usePeople() {
  const {
    data: customPeople = [],
    mutate: mutateCustom,
  } = useSWR("custom-people", fetchCustom, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: true,
  });

  const {
    data: removedKeys = new Set<string>(),
    mutate: mutateRemoved,
  } = useSWR("removed-people", fetchRemoved, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: true,
  });

  /** Combined list: base PEOPLE minus removed + custom additions */
  const people: Person[] = [
    ...PEOPLE.filter((p) => !removedKeys.has(`${p.prenom}|${p.nom}`)),
    ...customPeople,
  ];

  /** Add a new custom person — persisted in DB, visible for everyone */
  const addPerson = useCallback(
    async (person: Person) => {
      const personWithId: Person = {
        ...person,
        id: person.id ?? `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      // Optimistic update
      await mutateCustom(
        async (prev = []) => {
          await addCustomPerson(personWithId);
          return [...prev, personWithId];
        },
        { revalidate: true }
      );
    },
    [mutateCustom]
  );

  /** Remove a person (base or custom) — persisted in DB, visible for everyone */
  const removePerson = useCallback(
    async (person: Person) => {
      const key = `${person.prenom}|${person.nom}`;
      const isCustomPerson = customPeople.some(
        (p) => `${p.prenom}|${p.nom}` === key
      );

      if (isCustomPerson) {
        const target = customPeople.find((p) => `${p.prenom}|${p.nom}` === key);
        if (!target?.id) return;
        await mutateCustom(
          async (prev = []) => {
            await deleteCustomPerson(target.id!);
            return prev.filter((p) => `${p.prenom}|${p.nom}` !== key);
          },
          { revalidate: true }
        );
      } else {
        await mutateRemoved(
          async (prev = new Set()) => {
            await addRemovedKey(key);
            return new Set([...prev, key]);
          },
          { revalidate: true }
        );
      }
    },
    [customPeople, mutateCustom, mutateRemoved]
  );

  /** Restore a hidden base person — persisted in DB */
  const restorePerson = useCallback(
    async (person: Person) => {
      const key = `${person.prenom}|${person.nom}`;
      await mutateRemoved(
        async (prev = new Set()) => {
          await deleteRemovedKey(key);
          const next = new Set(prev);
          next.delete(key);
          return next;
        },
        { revalidate: true }
      );
    },
    [mutateRemoved]
  );

  const isRemoved = useCallback(
    (person: Person) => removedKeys.has(`${person.prenom}|${person.nom}`),
    [removedKeys]
  );

  const isCustom = useCallback(
    (person: Person) =>
      customPeople.some(
        (p) => `${p.prenom}|${p.nom}` === `${person.prenom}|${person.nom}`
      ),
    [customPeople]
  );

  /** Update a custom person's role and/or address — persisted in DB */
  const updatePerson = useCallback(
    async (
      person: Person,
      updates: { role?: Person["role"]; ville?: string; codePostal?: string; lat?: number; lng?: number }
    ) => {
      if (!person.id) return; // base PEOPLE cannot be updated via DB
      await mutateCustom(
        async (prev = []) => {
          await updatePersonProfile(person.id!, updates);
          return prev.map((p) =>
            p.id === person.id ? { ...p, ...updates } : p
          );
        },
        { revalidate: true }
      );
    },
    [mutateCustom]
  );

  return {
    people,
    addPerson,
    removePerson,
    restorePerson,
    updatePerson,
    isRemoved,
    isCustom,
    customPeople,
    removedNoms: removedKeys,
  };
}
