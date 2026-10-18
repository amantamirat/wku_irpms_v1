import { PublicationType } from "./publication.model";

export interface CreatePublicationDTO {
    author: string;
    title: string;
    type: PublicationType;
    abstract?: string;
    publishedDate: string; // ISO date string
    doi?: string;
    url?: string;
    publisher?: string;
    publicationId?: string;
}

export interface UpdatePublicationDTO {
    id: string;
    data: Partial<Omit<CreatePublicationDTO, 'author'>>;
}

export interface FilterPublicationsOptions {
    author?: string;
    type?: PublicationType;
    publisher?: string;
    fromDate?: string; // filter by publishedDate
    toDate?: string;
}