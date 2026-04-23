import { PositionType } from "./position.enum";

/* =========================
   Create DTOs
========================= */

export interface CreatePositionDTO {
    type: PositionType;
    name: string;
    parent?: string;
}

/* =========================
   Update DTO
========================= */

export interface UpdatePositionDTO {
    id: string;
    data: {
        name: string;
        parent: string; // only used if updating a Rank
    };
}

/* =========================
   Get / Filter DTO
========================= */

export interface GetPositionsDTO {
    type?: PositionType;  // filter by position or rank
    parent?: string;      // filter ranks by parent
    populate?: boolean;
}


export interface ExistsPositionDTO {
    parent?: string;     // optional, check ranks under parent
}
