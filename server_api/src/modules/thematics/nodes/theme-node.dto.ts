export interface CreateNodeDTO {
    name: string;
    parent?: string;
    isRoot?:boolean;
}

export interface UpdateNodeDTO {
    id: string;
    data: Partial<{
        name: number;
    }>;
}

export interface GetNodeDTO {
    parent?: string;
}


