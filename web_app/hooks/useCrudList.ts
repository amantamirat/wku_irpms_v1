import { useState } from "react";

export interface UseCrudListOptions<T> {
    initialItems?: T[];
    getId?: (item: T) => string | undefined;
}

export function useCrudList<T extends { _id?: string }>({
    initialItems = [],
    getId,
}: UseCrudListOptions<T> = {}) {
    const [items, setItems] = useState<T[]>(initialItems);
    const [loading, setLoading] = useState(false);

    const getItemId = (item: T) => {
        if (getId) return getId(item);
        return item._id;
    };

    const getById = (id: string) => {
        return items.find(item => getItemId(item) === id);
    };

    const addItem = (item: T) => {
        setItems(prev => [...prev, item]);
    };

    const updateItem = (item: T) => {
        setItems(prev => {
            const index = prev.findIndex(
                i => getItemId(i) === getItemId(item)
            );

            if (index !== -1) {
                const copy = [...prev];
                copy[index] = item;
                return copy;
            }

            return [...prev, item];
        });
    };

    const removeItem = (item: T | string) => {
        const id = typeof item === "string"
            ? item
            : getItemId(item);

        setItems(prev =>
            prev.filter(i => getItemId(i) !== id)
        );
    };

    const setAll = (newItems: T[]) => {
        setItems(newItems);
    };

    return {
        items,
        setAll,
        getById,
        addItem,
        updateItem,
        removeItem,
        loading,
        setLoading,
    };
}