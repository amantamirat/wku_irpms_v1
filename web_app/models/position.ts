export enum Category {
    academic = 'academic',
    supportive = 'supportive',
}
export type Position = {
    _id?: string;
    category: Category;
    position_title: string;
    createdAt?: Date;
    updatedAt?: Date;
}