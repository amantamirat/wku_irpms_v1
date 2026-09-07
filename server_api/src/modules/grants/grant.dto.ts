import { FundingSource, GrantStatus } from "./grant.model";

export interface FilterGrantsDTO {
    organization?: string;
    thematic?: string;
    fundingSource?: FundingSource;
    status?: GrantStatus;
}

export interface CreateGrantDTO {
    fundingSource: FundingSource;
    organization: string;
    title: string;
    amount: number;
    thematic: string;
    description?: string;
    status?:GrantStatus;
}

export interface UpdateGrantDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
        amount: number;
    }>;
    userId?: string;
}

export interface TransitionGrantDTO {
    id: string;
    to: GrantStatus;
    userId: string;
}



