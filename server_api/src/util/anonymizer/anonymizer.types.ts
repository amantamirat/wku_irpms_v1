import { PdfTextLocation } from "./pdf-location-matcher";

export enum AnonymizationEntityType {
    MEMBER = "member",
    EMAIL = "email",
    PHONE = "phone",
    ORCID = "orcid",
    IDENTIFIER = "identifier"
}

export interface AnonymizationEntity {
    type: AnonymizationEntityType;
    original: string;
    replacement: string;
    confidence: number;
    locations: PdfTextLocation[];
}

export interface AnonymizationResult {
    entities: AnonymizationEntity[];
    outputPath?: string;
}

