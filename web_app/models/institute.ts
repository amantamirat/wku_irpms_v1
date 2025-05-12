import { Sector } from "./sector";

export enum Ownership {
    public = 'public',
    private = 'private',
    NGO = 'NGO'
}

export type Institute = {
    name: string;
    address: {
        street?: string;
        city?: string;
        region?: string;
        country?: string;
        postal_code?: string;
    };
    sector: string | Sector;
    ownership_type: Ownership;
    createdAt?: Date;
    updatedAt?: Date;
};
