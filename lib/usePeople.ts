"use client";

import useSWR from "swr";
import { useCallback } from "react";
import type { Person } from "@/lib/people";
import {
  getResources,
  addResource,
  deleteResource,
  updateResource,
} from "@/app/actions/shared-state";

const POLL_INTERVAL_MS = 5000;

const fetchResources = () => getResources();

export function usePeople() {
  const { data: people = [], mutate } = useSWR("resources", fetchResources, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: true,
  });

  /** Add a new resource — persisted in DB for the user's zone */
  const addPerson = useCallback(
    async (person: Person) => {
      const personWithId: Person = {
        ...person,
        id: person.id ?? `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      await mutate(
        async (prev = []) => {
          await addResource(personWithId);
          return [...prev, personWithId];
        },
        { revalidate: true }
      );
    },
    [mutate]
  );

  /** Remove a resource — hard delete from DB */
  const removePerson = useCallback(
    async (person: Person) => {
      if (!person.id) return;
      await mutate(
        async (prev = []) => {
          await deleteResource(person.id!);
          return prev.filter((p) => p.id !== person.id);
        },
        { revalidate: true }
      );
    },
    [mutate]
  );

  /** Restore is no longer needed (no more removed_people table),
   *  kept for interface compatibility — becomes a no-op. */
  const restorePerson = useCallback(async (_person: Person) => {}, []);

  /** Update a resource's role and/or address */
  const updatePerson = useCallback(
    async (
      person: Person,
      updates: { role?: Person["role"]; ville?: string; codePostal?: string; lat?: number; lng?: number }
    ) => {
      if (!person.id) return;
      await mutate(
        async (prev = []) => {
          await updateResource(person.id!, updates);
          return prev.map((p) => (p.id === person.id ? { ...p, ...updates } : p));
        },
        { revalidate: true }
      );
    },
    [mutate]
  );

  const isRemoved = useCallback((_person: Person) => false, []);

  const isCustom = useCallback(
    (person: Person) => !!person.id && person.id.startsWith("custom-"),
    []
  );

  return {
    people,
    addPerson,
    removePerson,
    restorePerson,
    updatePerson,
    isRemoved,
    isCustom,
    customPeople: people.filter((p) => p.id?.startsWith("custom-")),
    removedNoms: new Set<string>(),
  };
}
