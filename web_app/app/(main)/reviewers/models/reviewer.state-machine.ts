import { ReviewerStatus } from "./reviewer.model";

export const REVIEWER_STATUS_ORDER: ReviewerStatus[] = [
    ReviewerStatus.pending,
    ReviewerStatus.accepted,
    ReviewerStatus.submitted,
    ReviewerStatus.approved
];

export const REVIEWER_TRANSITIONS: Record<ReviewerStatus, ReviewerStatus[]> = {
    [ReviewerStatus.pending]: [ReviewerStatus.accepted],
    [ReviewerStatus.accepted]: [ReviewerStatus.submitted, ReviewerStatus.pending],
    [ReviewerStatus.submitted]: [ReviewerStatus.approved, ReviewerStatus.accepted],
    [ReviewerStatus.approved]: [ReviewerStatus.submitted]
};