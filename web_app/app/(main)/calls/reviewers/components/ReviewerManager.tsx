'use client';

import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import ResultManager from "../results/components/ResultManager";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, ReviewerStatus } from "../models/reviewer.model";
import SaveReviewerDialog from "./SaveReviewerDialog";
import { ProjectDoc, DocStatus } from "@/app/(main)/projects/documents/models/document.model";

interface ReviewerManagerProps {
    projectDoc?: ProjectDoc;
    applicant?: Applicant;
    updateProjectDoc?: (projectDoc: ProjectDoc) => void;
}

const ReviewerManager = ({ projectDoc, applicant, updateProjectDoc }: ReviewerManagerProps) => {

    const confirm = useConfirmDialog();
    const { getApplicant, hasPermission } = useAuth();
    const loggedInApplicant = getApplicant();


    const emptyReviewer: Reviewer = {
        projectStage: projectDoc ?? undefined,
        applicant: applicant ?? undefined,
        weight: 1,
        status: ReviewerStatus.pending
    };

    const stageStatus = projectDoc?.status;
    const creationStatus = [DocStatus.submitted, DocStatus.selected];

    const canCreate = !!projectDoc && hasPermission([PERMISSIONS.REVIEWER.CREATE]) //&& stageStatus && creationStatus.includes(stageStatus);
    const canEdit = !!projectDoc && hasPermission([PERMISSIONS.REVIEWER.UPDATE]) //&& stageStatus && creationStatus.includes(stageStatus);
    const canDelete = !!projectDoc && hasPermission([PERMISSIONS.REVIEWER.DELETE]) //&& stageStatus && creationStatus.includes(stageStatus);

    const canPend = hasPermission([PERMISSIONS.REVIEWER.STATUS.PEND]);
    const canAccept = hasPermission([PERMISSIONS.REVIEWER.STATUS.ACCEPT]);
    const canSubmit = hasPermission([PERMISSIONS.REVIEWER.STATUS.SUBMIT]);
    const canApprove = hasPermission([PERMISSIONS.REVIEWER.STATUS.APPROVE]);

    // ✅ CRUD Hook
    const {
        items: reviewers,
        updateItem,
        removeItem,
        setAll,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Reviewer>();

    const [reviewer, setReviewer] = useState<Reviewer>(emptyReviewer);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // ✅ Fetch reviewers
    useEffect(() => {
        const fetchReviewers = async () => {
            try {
                setLoading(true);
                const data = await ReviewerApi.getReviewers({ applicant, projectStage: projectDoc });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch reviewers. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchReviewers();
    }, [applicant, projectDoc]);

    const updateDocument = (projectDoc: ProjectDoc) => {
        if (updateProjectDoc && projectDoc) {
            updateProjectDoc({
                ...projectDoc,
                project: projectDoc.project, stage: projectDoc.stage
            });
        }
    }

    // ✅ Save / update
    const onSaveComplete = (saved: Reviewer) => {
        updateItem(saved);
        hideSaveDialog();
    };

    const deleteReviewer = async (row: Reviewer) => {
        const deleted = await ReviewerApi.deleteReviewer(row);
        if (deleted) removeItem(row);
    };

    const updateStatus = async (row: Reviewer, next: ReviewerStatus) => {
        if (!row._id) return;
        const updated = await ReviewerApi.updateStatus(row._id, next);
        updateItem({
            ...updated, applicant: row.applicant,
            projectStage: row.projectStage
        });
    };

    const hideSaveDialog = () => {
        setReviewer(emptyReviewer);
        setShowSaveDialog(false);
    };

    const stateTransitionTemplate = (row: Reviewer) => {
        const current = row.status;
        const isReviewer = loggedInApplicant ? row.applicant === loggedInApplicant._id : false;

        let prev: ReviewerStatus | undefined;
        let next: ReviewerStatus | undefined;

        // pending → accepted
        if (current === ReviewerStatus.pending) {
            if (isReviewer && canAccept) {
                next = ReviewerStatus.accepted;
            }
        }
        // accepted → pending (Pend)
        if (current === ReviewerStatus.accepted) {
            if (canPend) {
                prev = ReviewerStatus.pending;
            }
            if (canSubmit) {
                next = ReviewerStatus.submitted;
            }
        }

        // submitted ↔ approved
        if (current === ReviewerStatus.submitted) {
            if (canApprove) {
                next = ReviewerStatus.approved;
            }
            if (canAccept) {
                prev = ReviewerStatus.accepted;
            }
        }

        return (
            <div className="flex gap-2">
                {/* ✅ Next button */}
                {next && (() => {
                    const nextStatus = next; // local constant for TS
                    return (
                        <Button
                            tooltip={`Make ${nextStatus}`}
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            onClick={() =>
                                confirm.ask({
                                    operation: `move to ${nextStatus}`,
                                    onConfirmAsync: () => updateStatus(row, nextStatus),
                                })
                            }
                        />
                    );
                })()}

                {/* ✅ Prev button */}
                {prev && (() => {
                    const prevStatus = prev; // local constant for TS
                    return (
                        <Button
                            tooltip={`Back to ${prevStatus}`}
                            icon="pi pi-undo"
                            severity="warning"
                            size="small"
                            onClick={() =>
                                confirm.ask({
                                    operation: `revert to ${prevStatus}`,
                                    onConfirmAsync: () => updateStatus(row, prevStatus),
                                })
                            }
                        />
                    );
                })()}
            </div>
        );
    };


    const columns = [
        applicant && { header: "Stage", field: "projectStage.stage.name", sortable: true },
        applicant && { header: "Project", field: "projectStage.project.title", sortable: true },
        projectDoc && canCreate && { header: "Workspace", field: "applicant.workspace.name" },
        projectDoc && canCreate && { header: "Reviewer", field: "applicant.name" },
        {
            header: "Score", field: "score",
            body: (row: Reviewer) => [ReviewerStatus.submitted, ReviewerStatus.approved].includes(row.status) ? row.score ?? "-" : "-"
        },
        {
            header: "Status", field: "status", body: (p: Reviewer) =>
                <MyBadge type="status" value={p.status ?? 'Unknown'} />
        },
        { body: stateTransitionTemplate }
    ].filter(Boolean);

    return (
        <>
            <CrudManager
                headerTitle="Reviewers"
                items={reviewers}
                dataKey="_id"
                columns={columns}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setReviewer({ ...emptyReviewer }); setShowSaveDialog(true); }}
                onEdit={(row) => { setReviewer(row); setShowSaveDialog(true); }}
                onDelete={(row: any) => confirm.ask({ item: row.applicant?.first_name ?? "", onConfirmAsync: () => deleteReviewer(row) })}
                rowExpansionTemplate={(row) =>
                    <ResultManager reviewer={row} />
                }
            />

            {(reviewer && showSaveDialog) && (
                <SaveReviewerDialog
                    visible={showSaveDialog}
                    reviewer={reviewer}
                    onCompelete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            )}
        </>
    );
};

export default ReviewerManager;
