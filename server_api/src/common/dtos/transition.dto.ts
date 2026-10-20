export interface TransitionRequestDto {
    id: string;
    current: string;
    next: string;
    reason?: string;
    userId?: string; // generic name instead of applicantId
}