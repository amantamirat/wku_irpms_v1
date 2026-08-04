import { TransitionRequestDto } from "@/types/util"



export interface EntityApi<T, Q = undefined> {
    getAll(options?: Q, populate?: boolean): Promise<T[]>
    getById?(id: string, populate?: boolean): Promise<T>
    create(data: Partial<T>): Promise<T>
    update(data: Partial<T>): Promise<T>
    transitionState?(id: string, dto: TransitionRequestDto): Promise<T>
    delete(item: Partial<T>): Promise<boolean>
    //for bulk imports
    import?: (formData: FormData, id?: string) => Promise<any>;
}