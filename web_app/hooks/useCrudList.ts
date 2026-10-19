import { useCallback, useRef, useState } from "react";

export interface UseCrudListOptions<T> {
    initialItems?: T[];
    /** How to read an item's id. Defaults to `item._id`. */
    getId?: (item: T) => string | undefined;
}

const hasId = (id: string | undefined | null): id is string =>
    id !== undefined && id !== null && id !== "";

export function useCrudList<T extends Record<string, any>>({
    initialItems,
    getId,
}: UseCrudListOptions<T> = {}) {
    const [items, setItems] = useState<T[]>(() => initialItems ?? []);
    const [loading, setLoading] = useState(false);

    // Keep the latest getId without making every callback depend on it,
    // so callers can pass an inline arrow without breaking memoization.
    const getIdRef = useRef(getId);
    getIdRef.current = getId;

    const getItemId = useCallback((item: T): string | undefined => {
        const custom = getIdRef.current;
        return custom ? custom(item) : (item._id as string | undefined);
    }, []);

    const getById = useCallback(
        (id: string) => items.find((item) => getItemId(item) === id),
        [items, getItemId]
    );

    // Replace the item with the same id, or add it if it's new.
    const upsert = useCallback(
        (prev: T[], item: T, prepend: boolean): T[] => {
            const id = getItemId(item);

            if (hasId(id)) {
                const index = prev.findIndex((i) => getItemId(i) === id);
                if (index !== -1) {
                    const copy = [...prev];
                    copy[index] = item;
                    return copy;
                }
            }

            return prepend ? [item, ...prev] : [...prev, item];
        },
        [getItemId]
    );

    /** Adds the item; if one with the same id already exists it is replaced (no duplicates). */
    const addItem = useCallback(
        (item: T, options?: { prepend?: boolean }) => {
            setItems((prev) => upsert(prev, item, options?.prepend ?? false));
        },
        [upsert]
    );

    /** Replaces the item with the same id, or adds it if not found. */
    const updateItem = useCallback(
        (item: T) => {
            setItems((prev) => upsert(prev, item, false));
        },
        [upsert]
    );

    /** Merges a partial update into the item with this id. No-op if not found. */
    const patchItem = useCallback(
        (id: string, patch: Partial<T>) => {
            setItems((prev) =>
                prev.map((i) => (getItemId(i) === id ? { ...i, ...patch } : i))
            );
        },
        [getItemId]
    );

    const removeItem = useCallback(
        (item: T | string) => {
            const id = typeof item === "string" ? item : getItemId(item);

            setItems((prev) => {
                if (hasId(id)) {
                    return prev.filter((i) => getItemId(i) !== id);
                }
                // No usable id: only remove that exact object, never "everything without an id"
                return typeof item === "string"
                    ? prev
                    : prev.filter((i) => i !== item);
            });
        },
        [getItemId]
    );

    const setAll = useCallback((newItems: T[]) => {
        setItems(newItems);
    }, []);

    /* ------------------------ Overlap-safe loading ------------------------ */

    const inFlight = useRef(0);

    /** Wraps an async call; `loading` stays true until every overlapping call has finished. */
    const withLoading = useCallback(async <R,>(fn: () => Promise<R>): Promise<R> => {
        inFlight.current += 1;
        setLoading(true);
        try {
            return await fn();
        } finally {
            inFlight.current -= 1;
            if (inFlight.current === 0) setLoading(false);
        }
    }, []);

    return {
        items,
        setAll,
        getById,
        addItem,
        updateItem,
        patchItem,
        removeItem,
        loading,
        setLoading,
        withLoading,
    };
}
