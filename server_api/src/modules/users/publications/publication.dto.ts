import { PublicationType } from "./publication.model";

export interface CreatePublicationDTO {
    applicant: string;
    title: string;
    type: PublicationType;
    abstract?: string;
    publishedDate?: string; // ISO date string
    doi?: string;
    url?: string;
    publisher?: string;
    publicationId?: string;
}

export interface UpdatePublicationDTO {
    id: string;
    data: {
        title?: string;
        abstract?: string;
        publishedDate?: string;
        doi?: string;
        url?: string;
        publisher?: string;
        publicationId?: string;
        // type is intentionally excluded (immutable)
        // applicant is excluded (usually not changed)
    };
}

export interface GetPublicationsOptions {
    applicant?: string;
    type?: PublicationType;
    publisher?: string;
    fromDate?: string; // filter by publishedDate
    toDate?: string;
    populate?: boolean;
}