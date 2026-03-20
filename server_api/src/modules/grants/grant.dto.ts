import { FundingSource, GrantStatus } from "./grant.model";

export interface GetGrantsDTO {
    organization?: string;
    fundingSource?: FundingSource;
    status?: GrantStatus;
    populate?: boolean;
}

export interface CreateGrantDTO {
    fundingSource: FundingSource;
    organization: string;
    title: string;
    amount: number;
    thematic: string;
    description?: string;
}

export interface UpdateGrantDTO {
    id: string;
    data: Partial<{
        title: string;
        description?: string;
        amount: number;
        status: GrantStatus;
    }>;
    userId?: string;
}

export interface TransitionGrantDTO {
    id: string;
    to: GrantStatus;
    userId: string;
}


