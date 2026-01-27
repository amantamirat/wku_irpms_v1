import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DocStatus } from "./document.status";

export class DocumentStateMachine {

    private static readonly transitions: Record<DocStatus, DocStatus[]> = {
        [DocStatus.submitted]: [DocStatus.selected, DocStatus.accepted, DocStatus.rejected,],
        [DocStatus.selected]: [DocStatus.under_review, DocStatus.submitted],
        [DocStatus.under_review]: [DocStatus.reviewed, DocStatus.selected],
        [DocStatus.reviewed]: [DocStatus.accepted, DocStatus.rejected, DocStatus.under_review],
        [DocStatus.accepted]: [DocStatus.reviewed, DocStatus.submitted],
        [DocStatus.rejected]: [DocStatus.reviewed, DocStatus.submitted]
    };

    static canTransition(from: DocStatus, to: DocStatus): boolean {
        return this.transitions[from]?.includes(to) ?? false;
    }

    static validateTransition(from: DocStatus, to: DocStatus): void {
        if (!this.canTransition(from, to)) {
            throw new AppError(ERROR_CODES.INVALID_STATE_TRANSITION);
        }
    }

    static getAllowedTransitions(from: DocStatus): DocStatus[] {
        return this.transitions[from] ?? [];
    }
}
