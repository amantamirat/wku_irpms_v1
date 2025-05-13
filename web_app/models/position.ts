export enum Category {
    academic = 'academic',
    supportive = 'supportive',
    external = 'external'
}
export type Position = {
    _id?: string;
    category: Category;
    position_title: string;
    createdAt?: Date;
    updatedAt?: Date;
}