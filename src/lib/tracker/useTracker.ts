"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Demo application tracker. Everything lives in this browser's storage,
 * per signed-in user (or "guest"). No government system is contacted and
 * no message is sent; reminders are shown inside the app.
 */

export const TRACK_STATUSES = ["saved", "documents_ready", "applied", "approved"] as const;
export type TrackStatus = (typeof TRACK_STATUSES)[number];

export type TrackedScheme = { status: TrackStatus; remind: boolean; savedAt: string };

type TrackerState = {
  tracked: Record<string, TrackedScheme>;
  /** Document ids the person has ticked as ready, per scheme. */
  docs: Record<string, string[]>;
};

const EMPTY: TrackerState = { tracked: {}, docs: {} };

function storageKey(owner: string): string {
  return `cwy:v1:${owner}:tracker`;
}

function read(owner: string): TrackerState {
  try {
    const raw = localStorage.getItem(storageKey(owner));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<TrackerState>;
    return { tracked: parsed.tracked ?? {}, docs: parsed.docs ?? {} };
  } catch {
    return EMPTY;
  }
}

function write(owner: string, state: TrackerState): void {
  try {
    localStorage.setItem(storageKey(owner), JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode); the tracker still works for this visit.
  }
}

export function useTracker(owner: string) {
  const [state, setState] = useState<TrackerState>(EMPTY);

  useEffect(() => {
    setState(read(owner));
  }, [owner]);

  const update = useCallback(
    (change: (prev: TrackerState) => TrackerState) => {
      setState((prev) => {
        const next = change(prev);
        write(owner, next);
        return next;
      });
    },
    [owner],
  );

  const toggleTracked = useCallback(
    (schemeId: string) =>
      update((prev) => {
        const tracked = { ...prev.tracked };
        if (tracked[schemeId]) delete tracked[schemeId];
        else tracked[schemeId] = { status: "saved", remind: true, savedAt: new Date().toISOString() };
        return { ...prev, tracked };
      }),
    [update],
  );

  const setStatus = useCallback(
    (schemeId: string, status: TrackStatus) =>
      update((prev) => {
        const current = prev.tracked[schemeId] ?? { status, remind: true, savedAt: new Date().toISOString() };
        return { ...prev, tracked: { ...prev.tracked, [schemeId]: { ...current, status } } };
      }),
    [update],
  );

  const setRemind = useCallback(
    (schemeId: string, remind: boolean) =>
      update((prev) => {
        const current = prev.tracked[schemeId] ?? { status: "saved" as const, remind, savedAt: new Date().toISOString() };
        return { ...prev, tracked: { ...prev.tracked, [schemeId]: { ...current, remind } } };
      }),
    [update],
  );

  const toggleDoc = useCallback(
    (schemeId: string, docId: string) =>
      update((prev) => {
        const have = new Set(prev.docs[schemeId] ?? []);
        if (have.has(docId)) have.delete(docId);
        else have.add(docId);
        return { ...prev, docs: { ...prev.docs, [schemeId]: [...have] } };
      }),
    [update],
  );

  return { tracked: state.tracked, docs: state.docs, toggleTracked, setStatus, setRemind, toggleDoc };
}

export type Tracker = ReturnType<typeof useTracker>;

/** Mock reminder dates: 7 days and 1 day before the deadline, if still ahead. */
export function reminderDates(deadline: string | undefined, today: Date): Date[] {
  if (!deadline) return [];
  const end = new Date(`${deadline}T09:00:00+05:30`);
  return [7, 1]
    .map((days) => new Date(end.getTime() - days * 86_400_000))
    .filter((date) => date.getTime() > today.getTime());
}

export function daysUntil(deadline: string, today: Date): number {
  const end = new Date(`${deadline}T23:59:59+05:30`);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}
