import { useState } from "react";

export interface UseCrudListOptions<T> {
    initialItems?: T[];
    getId?: (item: T) => string | undefined;
}

export function useCrudList<T extends { _id?: string }>({ initialItems = [], getId }: UseCrudListOptions<T> = {}) {
    const [items, setItems] = useState<T[]>(initialItems);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getItemId = (item: T) => {
        if (getId) return getId(item);
        return item._id;
    }

    const addItem = (item: T) => {
        setItems(prev => [...prev, item]);
    }

    const updateItem = (item: T) => {
        setItems(prev => {
            const index = prev.findIndex(i => getItemId(i) === getItemId(item));
            if (index !== -1) {
                const copy = [...prev];
                copy[index] = item;
                return copy;
            }
            return [...prev, item];
        });
    }

    const removeItem = (item: T | string) => {
        const id = typeof item === "string" ? item : getItemId(item);
        setItems(prev => prev.filter(i => getItemId(i) !== id));
    }

    const setAll = (newItems: T[]) => setItems(newItems);

    return {
        items,
        setAll,
        addItem,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError,
    };
}
