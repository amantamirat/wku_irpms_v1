'use client';
import React from "react";
import { Dialog } from "primereact/dialog";
import { Reviewer, ReviewerStatus, ReviewerTargetType } from "../models/reviewer.model";
import EvaluatorManager from "../evaluator/EvaluatorManager";

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
    const isVisible = visible ?? Boolean(reviewer);
    const isEditMode = enableEvaluation && reviewer?.status === ReviewerStatus.accepted;

    const project = typeof reviewer?.project === "object" ? reviewer.project : null;
    const application = typeof reviewer?.application === "object" ? reviewer.application : null;
    const verification = typeof reviewer?.verification === "object" ? reviewer.verification : null;

    const isApp = reviewer?.targetType === ReviewerTargetType.APPLICATION;
    
    const projectTitle = project?.title || "Unknown Project";
    const contextName = isApp 
        ? `Stage: ${(typeof application?.stage === "object" ? application.stage?.name : null) || "Application"}`
        : `Verification (Attempt ${verification?.attempt ?? 1})`;
    
    const documentPath = isApp 
        ? ((application as any)?.documentPath || "") 
        : (verification?.documentPath || "");

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
                    reviewerId={reviewer._id ?? ""}
                    projectTitle={projectTitle}
                    contextName={contextName}
                    documentPath={documentPath}
                    editMode={isEditMode}
                    onClose={onClose}
                />
            )}
        </Dialog>
    );
};

export default EvaluationDialog;