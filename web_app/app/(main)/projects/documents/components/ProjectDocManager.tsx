'use client';
import { BASE_URL } from "@/api/ApiClient";
import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { Project, ProjectStatus } from "../../models/project.model";
import { ProjectDocApi } from "../api/project.doc.api";
import { DocStatus, ProjectDoc } from "../models/document.model";
import SaveProjectStageDialog from "./SaveProjectStageDialog";
import ReviewerManager from "@/app/(main)/calls/reviewers/components/ReviewerManager";
import { Dialog } from "primereact/dialog";
import DocDetail from "./DocDetail";

interface ProjectDocManagerProps {
    project?: Project;
    updateProjectStatus?: (project: Project) => void;
    stage?: Stage;
}

const ProjectDocManager = ({ project, updateProjectStatus, stage }: ProjectDocManagerProps) => {
    const confirm = useConfirmDialog();
    const { getApplicant, hasPermission } = useAuth();

    const emptyStage: ProjectDoc = {
        stage: "-",
        project: project ?? "",
        status: DocStatus.submitted
    };

    // Permissions (adjust if needed)
    const isValidStatus = project ? (project.status === ProjectStatus.draft ||
        project.status === ProjectStatus.accepted) : false;

    const canCreate = isValidStatus && hasPermission([PERMISSIONS.DOCUMENT.CREATE]);
    const canDelete = hasPermission([PERMISSIONS.DOCUMENT.DELETE]);

    //Status Permissions
    const canSubmit = !project && hasPermission([PERMISSIONS.DOCUMENT.STATUS.SUBMIT]);
    const canSelect = !project && hasPermission([PERMISSIONS.DOCUMENT.STATUS.SELECT]);
    const canReview = !project && hasPermission([PERMISSIONS.DOCUMENT.STATUS.REVIEW]);
    const canAccept = !project && hasPermission([PERMISSIONS.DOCUMENT.STATUS.ACCEPT]);
    const canReject = !project && hasPermission([PERMISSIONS.DOCUMENT.STATUS.REJECT]);

    const enableMultiSelection = canAccept || canReject || canSelect;

    const [selectedDoc, setSelectedDoc] = useState<ProjectDoc>(emptyStage);
    const [selectedDocs, setSelectedDocs] = useState<ProjectDoc[]>([]);

    const [showSaveDialog, setShowSaveDialog] = useState(false);
    // const [showReviewers, setShowReviewers] = useState(false);


    // ✅ State + CRUD Hook
    const {
        items: projectDocs,
        updateItem,
        removeItem,
        setAll,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<ProjectDoc>();



    // ✅ Fetch project stages
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                setLoading(true);
                const data = await ProjectDocApi.getProjectDocs({
                    project,
                    stage
                });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch project stages. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, [project]);


    // ✅ Save / update
    const onSaveComplete = (saved: ProjectDoc) => {
        updateItem(saved);
        if (updateProjectStatus && project) {
            updateProjectStatus({ ...project, status: ProjectStatus.submitted })
        }
        hideSaveDialog();
    };

    const deleteDoc = async (row: ProjectDoc) => {
        const deleted = await ProjectDocApi.delete(row);
        if (deleted) {
            removeItem(row);
            if (updateProjectStatus && project) {
                updateProjectStatus({ ...project, status: projectDocs.length > 0 ? ProjectStatus.accepted : ProjectStatus.submitted })
            }
        };
    };

    const hideSaveDialog = () => {
        setSelectedDoc(emptyStage);
        setShowSaveDialog(false);
    };

    const updateStatus = async (docs: ProjectDoc[], next: DocStatus) => {
        const updatedDocs = await ProjectDocApi.updateStatus({ documents: docs }, next);
        for (const updatedDoc of updatedDocs) {
            const doc = projectDocs.find(d => d._id === updatedDoc._id);
            if (doc) {
                updateItem({ ...updatedDoc, stage: doc.stage, project: doc.project });
            }
        }
        setSelectedDocs([]);
    };

    const endToolbarTemplate = () => {
        return (
            <div className="my-2 mb-3 flex gap-2" >
                {canSelect &&
                    <Button
                        label="Select"
                        icon="pi pi-eye"
                        severity="secondary"
                        onClick={
                            () => {
                                confirm.ask({
                                    operation: `Select for review ${selectedDocs.length} projects`,
                                    onConfirmAsync: () => updateStatus(selectedDocs, DocStatus.selected)
                                });
                            }
                        }
                        disabled={selectedDocs.length === 0}
                    />
                }
                {canAccept &&
                    <Button
                        label="Accept"
                        icon="pi pi-check"
                        severity="success"
                        onClick={
                            () => {
                                confirm.ask({
                                    operation: `Accept ${selectedDocs.length} projects`,
                                    onConfirmAsync: () => updateStatus(selectedDocs, DocStatus.accepted)
                                });
                            }
                        }
                        disabled={selectedDocs.length === 0}
                    />
                }
                {
                    canReject &&
                    <Button
                        label="Reject"
                        icon="pi pi-minus"
                        severity="danger"
                        onClick={
                            () => {
                                confirm.ask({
                                    operation: `Reject ${selectedDocs.length} projects`,
                                    onConfirmAsync: async () => updateStatus(selectedDocs, DocStatus.rejected)
                                });
                            }
                        }
                        disabled={selectedDocs.length === 0}
                    />
                }
            </div>
        );
    }


    const stateTransitionTemplate = (row: ProjectDoc) => {
        const current = row.status;

        let prev: DocStatus | undefined = undefined;
        let next: DocStatus | undefined = undefined;

        if (current === DocStatus.selected) {
            if (canSubmit) {
                prev = DocStatus.submitted;
            }
        }

        if (current === DocStatus.accepted || current === DocStatus.rejected) {
            if (row.totalScore && canReview) {
                prev = DocStatus.reviewed;
            }
            if ((!row.totalScore || row.totalScore === null) && canSubmit) {
                prev = DocStatus.submitted;
            }
        }

        return (
            <div className="flex gap-2">
                {/* ✅ Prev Button */}
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
                                    operation: "revert",
                                    onConfirmAsync: () => updateStatus([row], prevStatus),
                                })
                            }
                        />
                    );
                })()}
            </div>
        );
    };


    const columns = [
        !stage && { header: "Stage", field: "stage.name", sortable: true },
        !project && { header: "Project", field: "project.title", sortable: true },
        !project && {
            header: "Budget", field: "project.totalBudget",
            body: (row: ProjectDoc) => {
                const budget = (row.project as Project)?.totalBudget;
                return typeof budget === "number"
                    ? budget.toLocaleString()
                    : "-";
            },
            sortable: true
        },
        {
            header: "Document",
            body: (row: ProjectDoc) => {
                if (!row.documentPath) return "No document";
                const url = `${BASE_URL}/${row.documentPath.replace(/^\\/, "")}`;
                return <button className="p-button p-button-text" onClick={() => window.open(url, "_blank")}>View</button>;
            }
        },
        {
            header: "Score",
            field: "totalScore",
            body: (row: ProjectDoc) => {
                const score = row?.totalScore;
                return typeof score === "number"
                    ? score
                    : "-";
            },
            sortable: true
        },
        {
            header: "Status",
            body: (row: ProjectDoc) => <MyBadge type="status" value={row.status ?? "Unknown"} />
        },
        { body: stateTransitionTemplate },
    ].filter(Boolean);

    return (
        <>
            <CrudManager
                headerTitle="Project Docs"
                items={projectDocs}
                dataKey="_id"

                columns={columns}

                loading={loading}
                error={error}

                canCreate={canCreate}
                canDelete={canDelete}
                onCreate={() => { setSelectedDoc({ ...emptyStage }); setShowSaveDialog(true); }}
                onDelete={(row: any) => confirm.ask({ item: row.stage?.name ?? "", onConfirmAsync: () => deleteDoc(row) })}


                toolbarEnd={endToolbarTemplate()}

                canDeleteRow={(row: ProjectDoc) => row.status === DocStatus.submitted}

                rowExpansionTemplate={(row) => <DocDetail doc={row as ProjectDoc}
                    updateProjectDoc={(updatedDoc: ProjectDoc) =>
                        updateItem({
                            ...updatedDoc,
                            stage: row.stage,
                            project: row.project
                        })
                    }
                />}

                enableSearch={!project}
                enableSelection={enableMultiSelection}
                selectionMode={enableMultiSelection ? "multiple" : undefined}
                selectedItems={enableMultiSelection ? selectedDocs : undefined}
                onSelectionChange={(value) => setSelectedDocs((value ?? []) as ProjectDoc[])}
            />

            {(isValidStatus && showSaveDialog) && (
                <SaveProjectStageDialog
                    visible={showSaveDialog}
                    project={project}
                    projectDoc={selectedDoc}
                    onComplete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            )}
        </>
    );
};

export default ProjectDocManager;
