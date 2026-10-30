export interface TransitionRequestDto {
    id: string;
    current: string;
    next: string;
    reason?: string;
    userId?: string; // generic name instead of applicantId
}

export const buildTransitionRequestDto = (
    id: string,
    body: Omit<TransitionRequestDto, 'id' | 'userId'>,
    userId?: string
): TransitionRequestDto => ({
    id: String(id),
    current: body.current,
    next: body.next,
    reason: body.reason,
    userId,
});