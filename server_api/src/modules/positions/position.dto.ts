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

export interface FilterPositionsDTO {
    search?: string;     // optional: for name search
    name?: string;
}

