export interface CreateVerificationDTO {
    grant: string;
    deadline: Date;
}

export interface UpdateVerificationDTO {
    deadline: Date;
}