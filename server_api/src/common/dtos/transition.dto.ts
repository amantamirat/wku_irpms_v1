export interface TransitionRequestDto {
    id: string;
    current: string;
    next: string;
    applicantId?: string; // generic name instead of applicantId
}