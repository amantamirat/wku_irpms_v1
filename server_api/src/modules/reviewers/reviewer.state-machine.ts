import { ReviewerStatus } from "./reviewer.status";

export const REVIEWER_TRANSITIONS: Record<ReviewerStatus, ReviewerStatus[]> = {
    [ReviewerStatus.pending]: [ReviewerStatus.accepted],
    [ReviewerStatus.accepted]: [ReviewerStatus.submitted, ReviewerStatus.pending],
    [ReviewerStatus.submitted]: [ReviewerStatus.approved, ReviewerStatus.accepted],
    [ReviewerStatus.approved]: [ReviewerStatus.submitted]
};