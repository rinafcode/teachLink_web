'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createInitialState,
  DragDropItem,
  DragDropState,
  DragDropZone,
  moveItemBetweenZones,
  reorderItems,
} from '../utils/dragDropUtils';

interface UseDragDropOptions {
  zones: DragDropZone[];
  items: DragDropItem[];
  storageKey?: string;
  autoSaveDelay?: number;
  onAutoSave?: (state: DragDropState) => void | Promise<void>;
}

interface UseDragDropReturn {
  state: DragDropState;
  isSaving: boolean;
  lastSavedAt: number | null;
  saveError: string | null;
  reorderInZone: (zoneId: string, fromIndex: number, toIndex: number) => void;
  moveToZone: (itemId: string, fromZoneId: string, toZoneId: string, toIndex?: number) => void;
  resetState: () => void;
  saveNow: () => Promise<void>;
}

const defaultStorageKey = 'teachlink.dragdrop.state';

export const useDragDrop = ({
  zones,
  items,
  storageKey = defaultStorageKey,
  autoSaveDelay = 700,
  onAutoSave,
}: UseDragDropOptions): UseDragDropReturn => {
  const initialState = useMemo(() => createInitialState(zones, items), [zones, items]);

  const [state, setState] = useState<DragDropState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistState = useCallback(
    async (nextState: DragDropState) => {
      setIsSaving(true);
      setSaveError(null);

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, JSON.stringify(nextState));
        }

        if (onAutoSave) {
          await onAutoSave(nextState);
        }

        setLastSavedAt(Date.now());
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Failed to save drag-and-drop state');
      } finally {
        setIsSaving(false);
      }
    },
    [onAutoSave, storageKey],
  );

  const queueAutoSave = useCallback(
    (nextState: DragDropState) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        void persistState(nextState);
      }, autoSaveDelay);
    },
    [autoSaveDelay, persistState],
  );

  const updateState = useCallback(
    (updater: (prev: DragDropState) => DragDropState) => {
      setState((prev) => {
        const next = updater(prev);
        queueAutoSave(next);
        return next;
      });
    },
    [queueAutoSave],
  );

  const reorderInZone = useCallback(
    (zoneId: string, fromIndex: number, toIndex: number) => {
      updateState((prev) => {
        const zoneItems = prev[zoneId] ?? [];
        return {
          ...prev,
          [zoneId]: reorderItems(zoneItems, fromIndex, toIndex),
        };
      });
    },
    [updateState],
  );

  const moveToZone = useCallback(
    (itemId: string, fromZoneId: string, toZoneId: string, toIndex?: number) => {
      updateState((prev) => moveItemBetweenZones(prev, itemId, fromZoneId, toZoneId, toIndex));
    },
    [updateState],
  );

  const resetState = useCallback(() => {
    setState(initialState);
    queueAutoSave(initialState);
  }, [initialState, queueAutoSave]);

  const saveNow = useCallback(async () => {
    await persistState(state);
  }, [persistState, state]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }

    try {
      const restored = JSON.parse(raw) as DragDropState;
      setState(restored);
    } catch {
      setState(initialState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]); // initialState intentionally excluded - only run on mount

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    isSaving,
    lastSavedAt,
    saveError,
    reorderInZone,
    moveToZone,
    resetState,
    saveNow,
  };
};