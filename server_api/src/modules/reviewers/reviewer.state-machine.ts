export enum ReviewerStatus {
    pending = 'pending',
    accepted = 'accepted',
    decliend = 'declined',
    submitted = 'submitted',
    approved = 'approved',
    rejected = 'rejected'
}

export const REVIEWER_TRANSITIONS: Record<ReviewerStatus, ReviewerStatus[]> = {
    [ReviewerStatus.pending]: [ReviewerStatus.accepted, ReviewerStatus.decliend],
    [ReviewerStatus.decliend]: [ReviewerStatus.pending],
    [ReviewerStatus.accepted]: [ReviewerStatus.submitted, ReviewerStatus.pending],
    [ReviewerStatus.submitted]: [ReviewerStatus.approved, ReviewerStatus.rejected, ReviewerStatus.accepted],
    [ReviewerStatus.approved]: [ReviewerStatus.submitted],
    [ReviewerStatus.rejected]: [ReviewerStatus.submitted]
};

