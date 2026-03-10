import { FundingSource } from "./grant.model";

export interface GetGrantsDTO {
    organization?: string;
    fundingSource?: FundingSource;
}

export interface CreateGrantDTO {
    fundingSource: FundingSource;
    organization: string;
    title: string;
    amount: number;
    thematic: string;
    //stages: number;
    description?: string;
}

export interface UpdateGrantDTO {
    id: string;
    data: Partial<{
        title: string;
        description?: string;
        amount: number;
    }>;
    userId: string;
}


