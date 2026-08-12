'use client';

import React from "react";
import { Dialog } from "primereact/dialog";
import EvaluatorManager from "../evaluator/EvaluatorManager";
import { Reviewer, ReviewerStatus } from "../models/reviewer.model";

interface EvaluationDialogProps {
    reviewer: Reviewer | null;
    visible?: boolean;
    enableEvaluation?: boolean;
    onClose: () => void;
    header?: string;
}

export const EvaluationDialog: React.FC<EvaluationDialogProps> = ({
    reviewer,
    visible,
    enableEvaluation = false,
    onClose,
    header = "Evaluation Details",
}) => {
    // Determine visibility based on explicit prop or presence of a reviewer
    const isVisible = visible ?? Boolean(reviewer);
    const isEditMode = enableEvaluation && reviewer?.status === ReviewerStatus.accepted;

    return (
        <Dialog
            header={header}
            visible={isVisible}
            maximized
            modal
            onHide={onClose}
            contentClassName="p-0"
        >
            {reviewer && (
                <EvaluatorManager
                    reviewer={reviewer}
                    editMode={isEditMode}
                    onClose={onClose}
                />
            )}
        </Dialog>
    );
};

export default EvaluationDialog;