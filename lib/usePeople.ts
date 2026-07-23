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

  /** Update any person's role and/or address — persisted in DB.
   *  Base PEOPLE (no id) are first inserted into custom_people, then updated.
   *  The original base entry is hidden via removed_people so there's no duplicate.
   */
  const updatePerson = useCallback(
    async (
      person: Person,
      updates: { role?: Person["role"]; ville?: string; codePostal?: string; lat?: number; lng?: number }
    ) => {
      const existingCustom = customPeople.find(
        (p) => `${p.prenom}|${p.nom}` === `${person.prenom}|${person.nom}`
      );

      if (existingCustom?.id) {
        // Already a custom entry — just update it
        await mutateCustom(
          async (prev = []) => {
            await updatePersonProfile(existingCustom.id!, updates);
            return prev.map((p) =>
              p.id === existingCustom.id ? { ...p, ...updates } : p
            );
          },
          { revalidate: true }
        );
      } else {
        // Base PEOPLE entry — insert as custom override, then hide the base entry
        const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const overridden: Person = { ...person, ...updates, id: newId };
        const baseKey = `${person.prenom}|${person.nom}`;

        await Promise.all([
          mutateCustom(
            async (prev = []) => {
              await addCustomPerson(overridden);
              return [...prev, overridden];
            },
            { revalidate: false }
          ),
          mutateRemoved(
            async (prev = new Set()) => {
              await addRemovedKey(baseKey);
              return new Set([...prev, baseKey]);
            },
            { revalidate: true }
          ),
        ]);
      }
    },
    [customPeople, mutateCustom, mutateRemoved]
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
