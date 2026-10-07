import { FundingSource, GrantStatus } from "./grant.model";

export interface FilterGrantsDTO {
    ids?: string[];

    organization?: string;
    organizationIds?: string[];

    thematic?: string;
    agreementTemplate?: string;
    fundingSource?: string;
    status?: GrantStatus;
}

export interface CreateGrantDTO {
    fundingSource: FundingSource;
    organization: string;
    title: string;
    constraint?: string;
    agreementTemplate?: string | null;
    amount: number;
    thematic: string;
    description?: string;
    status?: GrantStatus;
}

export interface UpdateGrantDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
        constraint?: string;
        agreementTemplate: string | null;
        amount: number;
    }>;
    userId?: string;
}





