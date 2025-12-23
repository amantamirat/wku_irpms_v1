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
import { Project } from "../../models/project.model";
import ReviewerManager from "../../reviewers/components/ReviewerManager";
import { ProjectDocApi } from "../api/project.doc.api";
import { DocStatus, ProjectDoc } from "../models/document.model";
import SaveProjectStageDialog from "./SaveProjectStageDialog";

interface ProjectDocManagerProps {
    project?: Project;
    updateProjectStatus?: (project: Project) => void;
    stage?: Stage;
}

const ProjectDocManager = ({ project, updateProjectStatus, stage }: ProjectDocManagerProps) => {
    const confirm = useConfirmDialog();
    const { getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;
    const isLeadPI = project ? loggedApplicantId === (project?.leadPI as any)._id : false;

    const [selectedDocs, setSelectedDocs] = useState<ProjectDoc[]>([]);

    const emptyStage: ProjectDoc = {
        project: project ?? "",
        status: DocStatus.pending
    };

    // ✅ Permissions (adjust if needed)
    const canCreate = !!project && isLeadPI && hasPermission([PERMISSIONS.DOCUMENT.CREATE]);
    const canDelete = !!project && isLeadPI && hasPermission([PERMISSIONS.DOCUMENT.DELETE]);
    //Status Permissions
    const canAccept = hasPermission([PERMISSIONS.DOCUMENT.STATUS.ACCEPT]);
    const canReject = hasPermission([PERMISSIONS.DOCUMENT.STATUS.REJECT]);
    const canReview = hasPermission([PERMISSIONS.DOCUMENT.STATUS.REVIEW]);

    const enableMultiSelection = canAccept || canReject;

    //const canUpdateStatus = enableMultiSelection && hasPermission([PERMISSIONS.DOCUMENT.UPDATE_STATUS]);
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
    const [activeIndex, setActiveIndex] = useState(0);
    const items = [
        {
            label: 'Pending', icon: 'pi pi-home'
            , value: 'pending'

        },
        {
            label: 'Submitted', icon: 'pi pi-chart-line'
            //, value: 'submitted' 
        },
        {
            label: 'Archived', icon: 'pi pi-list'
            //, value: 'accepted' 
        }
    ];

    const [selectedStage, setSelectedStage] = useState<ProjectDoc>(emptyStage);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

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
    const onSaveComplete = (savedStage: ProjectDoc, syncedProject?: Project) => {
        updateItem(savedStage);
        if (updateProjectStatus) {
            if (project && syncedProject) {
                updateProjectStatus({ ...project, status: syncedProject.status })
            }
        }
        hideSaveDialog();
    };

    const deleteStage = async (row: ProjectDoc) => {
        const deleted = await ProjectDocApi.deleteProjectStage(row);
        if (deleted) {
            removeItem(row);
            if (updateProjectStatus) {
                const { projectStage, syncedProject } = deleted;
                if (project && syncedProject) {
                    updateProjectStatus({ ...project, status: syncedProject.status })
                }
            }
        };
    };

    const hideSaveDialog = () => {
        setSelectedStage(emptyStage);
        setShowSaveDialog(false);
    };

    const updateStatus = async (docs: ProjectDoc[], next: DocStatus) => {
        if (next !== DocStatus.reviewed && !docs.every(d => d.status === DocStatus.reviewed)) {
            throw new Error(
                "All selected documents must be reviewed before acceptance."
            );
        }
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
        if (!canAccept && !canReject) {
            return undefined;
        }
        return (
            <div className="my-2 mb-3 flex gap-2" >
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


    const stateTransitionTemplate = (rowData: ProjectDoc) => {
        if (!canReview) {
            return
        }
        const state = rowData.status;
        return (
            <div className="flex gap-2">
                {(state === DocStatus.accepted || state === DocStatus.rejected) && (
                    <Button
                        tooltip="revert"
                        icon="pi pi-undo"
                        severity="warning"
                        size="small"
                        onClick={() =>
                            confirm.ask({
                                operation: "revert",
                                onConfirmAsync: () => updateStatus([rowData], DocStatus.reviewed)
                            })
                        }
                    />
                )}
            </div>
        );
    };


    const columns = [
        ...((!stage) ? [
            { header: "Stage", field: "stage.name", sortable: true },
        ] : []),
        ...((!project) ? [
            { header: "Project", field: "project.title", sortable: true },
        ] : []),
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
                if ([DocStatus.reviewed, DocStatus.accepted, DocStatus.rejected].includes(row.status)) {
                    return row.totalScore ?? "-";
                }
                return "-";
            },
            sortable: true
        },
        {
            header: "Status",
            body: (row: ProjectDoc) => <MyBadge type="status" value={row.status ?? "Unknown"} />
        },
        { body: stateTransitionTemplate }
    ];

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
                onCreate={() => { setSelectedStage(emptyStage); setShowSaveDialog(true); }}
                onDelete={(row: any) => confirm.ask({ item: row.stage?.name ?? "", onConfirmAsync: () => deleteStage(row) })}

                toolbarEnd={endToolbarTemplate()}

                rowExpansionTemplate={(row) => <ReviewerManager projectStage={row}
                    updateProjectStage={onSaveComplete} showControllers />}
                enableSearch

                enableSelection={enableMultiSelection}
                selectionMode={enableMultiSelection ? "multiple" : undefined}
                selectedItems={enableMultiSelection ? selectedDocs : undefined}
                onSelectionChange={(value) => setSelectedDocs((value ?? []) as ProjectDoc[])}
            />

            {project && (
                <SaveProjectStageDialog
                    visible={showSaveDialog}
                    project={project}
                    projectStage={selectedStage}
                    onComplete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            )}
        </>
    );
};

export default ProjectDocManager;
