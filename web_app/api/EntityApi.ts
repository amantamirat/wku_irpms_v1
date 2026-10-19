export interface StateTransition {
    current: string;
    next: string;
    reason?: string;
}


export interface EntityApi<T, Q = undefined> {
    getAll(filter?: Q, populate?: boolean): Promise<T[]>
    getById?(id: string, populate?: boolean): Promise<T>
    lookup?(filter?: Q): Promise<T[]>
    create(data: Partial<T>): Promise<T>
    update(data: Partial<T>): Promise<T> //i will make it later update(id, data)
    transitionState?(id: string, dto: StateTransition): Promise<T>
    delete(item: Partial<T>): Promise<boolean>  //i will make it later delete(id)
}

