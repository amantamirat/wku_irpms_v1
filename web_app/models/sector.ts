export type Sector = {
    _id?: string;
    sector_name: string;
};

export const validateSector = (sector: Sector): boolean => {
    if (sector.sector_name.trim() === "") {
        return false;
    }
    return true;
};