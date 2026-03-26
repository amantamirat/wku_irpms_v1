import { TransitionRequestDto } from "@/types/util"

export interface EntityApi<T, Q = undefined> {
    getAll(options?: Q): Promise<T[]>
    getById?(id: string,): Promise<T>
    create(data: Partial<T>): Promise<T>
    update(data: Partial<T>): Promise<T>
    transitionState?(id: string, dto: TransitionRequestDto): Promise<T>
    delete(item: T): Promise<boolean>
    //for bulk imports
    import?: (formData: FormData, id?: string) => Promise<any>;
}