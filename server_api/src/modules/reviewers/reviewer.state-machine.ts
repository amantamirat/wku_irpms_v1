export enum ReviewerStatus {
    pending = 'pending',
    verified = 'verified',
    declined = 'declined',
    submitted = 'submitted',
    accepted = 'accepted',
    rejected = 'rejected'
}

export const REVIEWER_TRANSITIONS: Record<ReviewerStatus, ReviewerStatus[]> = {
    [ReviewerStatus.pending]: [ReviewerStatus.verified, ReviewerStatus.declined],
    [ReviewerStatus.declined]: [ReviewerStatus.pending],
    [ReviewerStatus.verified]: [ReviewerStatus.submitted, ReviewerStatus.pending],
    [ReviewerStatus.submitted]: [ReviewerStatus.accepted, ReviewerStatus.rejected, ReviewerStatus.verified],
    [ReviewerStatus.accepted]: [ReviewerStatus.submitted],
    [ReviewerStatus.rejected]: [ReviewerStatus.submitted]
};

