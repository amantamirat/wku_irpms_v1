export function updateItems<T extends { _id?: string }>(
    items: T[],
    saved: T
): T[] {
    const index = items.findIndex((i) => i._id === saved._id);

    return index !== -1
        ? items.map((i, idx) => (idx === index ? saved : i))
        : [...items, saved];
}

export function removeItem<T extends { _id?: string }>(
    items: T[],
    id?: string
): T[] {
    if (!id) return items; // or throw an error if you prefer strictness

    return items.filter(item => item._id !== id);
}

