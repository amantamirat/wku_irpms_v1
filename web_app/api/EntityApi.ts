export interface StateTransition {
    current: string;
    next: string;
}


export interface EntityApi<T, Q = undefined> {
    getAll(filter?: Q, populate?: boolean): Promise<T[]>
    getById?(id: string, populate?: boolean): Promise<T>
    lookup?(filter?: Q): Promise<T[]>
    create(data: Partial<T>): Promise<T>
    update(data: Partial<T>): Promise<T>
    transitionState?(id: string, dto: StateTransition): Promise<T>
    delete(item: Partial<T>): Promise<boolean>
    //for bulk imports
    import?: (formData: FormData, id?: string) => Promise<any>;
}

