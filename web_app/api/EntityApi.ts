import { TransitionRequestDto } from "@/types/util"

export interface EntityApi<T, Q = undefined> {
    getAll(options?: Q): Promise<T[]>
    create(data: Partial<T>): Promise<T>
    update(data: Partial<T>): Promise<T>
    transitionState?(id: string, dto: TransitionRequestDto): Promise<T>
    delete(item: T): Promise<boolean>
}