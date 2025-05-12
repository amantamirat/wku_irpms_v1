import { Position } from "./position";

export type Rank = {
    _id?: string;
    position: string | Position;
    rank_title: string;
    createdAt?: Date;
    updatedAt?: Date;
}