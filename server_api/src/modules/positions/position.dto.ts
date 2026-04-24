/* =========================
   Create DTO
========================= */

export interface CreatePositionDTO {
    name: string;
}

/* =========================
   Update DTO
========================= */

export interface UpdatePositionDTO {
    id: string;
    data: {
        name: string;
    };
}

/* =========================
   Get / Filter DTO
========================= */

export interface GetPositionsDTO {
    search?: string;     // optional: for name search
    populate?: boolean;  // keep if you actually use it
}

export interface ExistsPositionDTO {
    name: string;
}