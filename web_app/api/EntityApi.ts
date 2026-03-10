export interface EntityApi<T, Q = undefined> {
    getAll(options?: Q): Promise<T[]>
    create(data: Partial<T>): Promise<T>
    update(data: Partial<T>): Promise<T>
    delete(item: T): Promise<boolean>
}