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
import ResultManager from "../../results/components/ResultManager";
import { ReviewerApi } from "../api/reviewer.api";
import { GetReviewersOptions, Reviewer, ReviewerStatus } from "../models/reviewer.model";
import SaveReviewerDialog from "./SaveReviewerDialog";
import { ProjectDoc, DocStatus } from "@/app/(main)/projects/documents/models/document.model";

interface ReviewerManagerProps {
    projectStage?: ProjectDoc;
    updateProjectStage?: (projectStage: ProjectDoc) => void;
    applicant?: Applicant;
    showControllers?: boolean;
}

const ReviewerManager = ({ projectStage, applicant, showControllers, updateProjectStage }: ReviewerManagerProps) => {
    
    const confirm = useConfirmDialog();
    const { getApplicant: getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;

    const emptyReviewer: Reviewer = {
        projectStage: projectStage ?? undefined,
        applicant: applicant ?? undefined,
        weight: 1,
        status: ReviewerStatus.pending
    };

    const stageStatus = projectStage?.status;
    const creationStatus = [DocStatus.pending, DocStatus.submitted];
    const canCreate = hasPermission([PERMISSIONS.REVIEWER.CREATE]) && stageStatus && creationStatus.includes(stageStatus);
    const canEdit = hasPermission([PERMISSIONS.REVIEWER.UPDATE]) && stageStatus && creationStatus.includes(stageStatus);
    const canDelete = hasPermission([PERMISSIONS.REVIEWER.DELETE]) && stageStatus && creationStatus.includes(stageStatus);

    const canPend = hasPermission([PERMISSIONS.REVIEWER.STATUS.PEND]);
    const canVerify = hasPermission([PERMISSIONS.REVIEWER.STATUS.VERIFY]);
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
                const options: GetReviewersOptions = {
                    applicant: applicant,
                    projectStage: projectStage
                };
                const data = await ReviewerApi.getReviewers(options);
                setAll(data.map(r => ({ ...r, applicant: applicant ?? r.applicant, projectStage: projectStage ?? r.projectStage })));
            } catch (err: any) {
                setError("Failed to fetch reviewers. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchReviewers();
    }, [applicant, projectStage]);

    const updateDocument = (projectDoc: ProjectDoc) => {
        if (updateProjectStage && projectStage) {
            updateProjectStage({
                ...projectDoc,
                project: projectStage.project, stage: projectStage.stage
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
        const { updated, syncedProjectStage } = await ReviewerApi.updateStatus(row._id, next);
        updateItem({ ...updated, applicant: row.applicant, projectStage: row.projectStage });
        updateDocument(syncedProjectStage);
    };

    const hideSaveDialog = () => {
        setReviewer(emptyReviewer);
        setShowSaveDialog(false);
    };

    const stateTransitionTemplate = (rowData: Reviewer) => {
        const state = rowData.status;
        const isReviewer = (rowData?.applicant as any)._id === loggedApplicantId;
        // const isActiveReviewer = isOwner && reviewer?.status === ReviewerStatus.active;
        return (
            <div className="flex gap-2">
                {/* pending → active */}
                {(isReviewer && applicant && canVerify && state === ReviewerStatus.pending) && (
                    <Button
                        label="Verify"
                        icon="pi pi-check"
                        severity="success"
                        size="small"
                        onClick={() => {
                            confirm.ask({
                                operation: 'activate',
                                onConfirmAsync: () => updateStatus(rowData, ReviewerStatus.verified)
                            });
                        }}
                    />
                )}

                {/* active → pending*/}
                {canPend && state === ReviewerStatus.verified && (
                    <Button
                        label="Pend"
                        icon="pi pi-arrow-left"
                        severity="warning"
                        size="small"
                        onClick={() => {
                            confirm.ask({
                                operation: 'pend',
                                onConfirmAsync: () => updateStatus(rowData, ReviewerStatus.pending)
                            });
                        }}
                    />
                )}

                {canApprove && (<>
                    {/* submitted → approved */}
                    {state === ReviewerStatus.submitted && (
                        <Button
                            label="Approve"
                            icon="pi pi-check-circle"
                            severity="info"
                            size="small"
                            onClick={() => confirm.ask({
                                operation: 'Approve',
                                onConfirmAsync: () => updateStatus(rowData, ReviewerStatus.approved)
                            })}
                        />)}
                    {/* approved → submitted */}
                    {state === ReviewerStatus.approved && (
                        <Button
                            tooltip="Revert"
                            icon="pi pi-undo"
                            severity="warning"
                            size="small"
                            onClick={() => confirm.ask({
                                operation: 'revert to submitted',
                                onConfirmAsync: () => updateStatus(rowData, ReviewerStatus.submitted)
                            })}
                        />
                    )}
                </>)}
            </div>
        );
    }

    const columns = [
        applicant && { header: "Stage", field: "projectStage.stage.name", sortable: true },
        applicant && { header: "Project", field: "projectStage.project.title", sortable: true },
        projectStage && { header: "Workspace", field: "applicant.workspace.name" },
        projectStage && { header: "Reviewer", field: "applicant.name" },
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
                onCreate={() => { setReviewer(emptyReviewer); setShowSaveDialog(true); }}
                onEdit={(row) => { setReviewer(row); setShowSaveDialog(true); }}
                onDelete={(row: any) => confirm.ask({ item: row.applicant?.first_name ?? "", onConfirmAsync: () => deleteReviewer(row) })}
                rowExpansionTemplate={(row) =>
                    <ResultManager reviewer={row} updateStatus={updateStatus} />
                }
            />

            {reviewer && (
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
