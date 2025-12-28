"use client";

import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { Project } from "../../models/project.model";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator, CollaboratorStatus } from "../models/collaborator.model";
import CollaboratorDialog from "./CollaboratorDialog";

interface CollaboratorProps {
    project?: Project;
    applicant?: Applicant;
    flyMode?: boolean;
    onSave?: (collaborator: Collaborator) => void;
    onRemove?: (collaborator: Collaborator) => void;
}

const CollaboratorManager = ({ project, applicant, flyMode, onSave, onRemove }: CollaboratorProps) => {
    const confirm = useConfirmDialog();
    const { getApplicant: getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;
    const isLeadPI = project ? loggedApplicantId === (project.leadPI as any)._id : false;

    const emptyCollaborator: Collaborator = {
        project: project ?? "",
        applicant: applicant ?? "",
        status: CollaboratorStatus.pending
    };

    // ✅ Permissions
    const canCreate = !!project && isLeadPI && hasPermission([PERMISSIONS.COLLABORATOR.CREATE]);
    const canDelete = !!project && isLeadPI && hasPermission([PERMISSIONS.COLLABORATOR.DELETE]);

    const canVerify = hasPermission([PERMISSIONS.COLLABORATOR.STATUS.VERIFY]);
    const canPend = hasPermission([PERMISSIONS.COLLABORATOR.STATUS.PEND]);

    // CRUD state handler
    const {
        items: collaborators,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError,
    } = useCrudList<Collaborator>();

    const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator>(emptyCollaborator);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Fetch collaborators for project
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await CollaboratorApi.getCollaborators({ project: project, applicant: applicant });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch collaborators. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        if (project?._id || applicant?._id) {
            fetchData();
        }
        if (flyMode && project) {
            setAll(project?.collaborators ?? []);
        }
    }, [project, applicant]);


    // Save or update collaborator
    const onSaveComplete = (saved: Collaborator) => {
        updateItem(saved);
        if (flyMode) {

        }
        setSelectedCollaborator(emptyCollaborator);
        setShowSaveDialog(false);
    };

    // Delete collaborator
    const deleteCollaborator = async (row: Collaborator) => {
        if (flyMode) {
            //remove from
        }
        const deleted = await CollaboratorApi.deleteCollaborator(row);
        if (deleted) {
            removeItem(row);
        }
    };

    const updateStatus = async (row: Collaborator, next: CollaboratorStatus) => {
        if (!row._id) {
            return;
        }
        const updated = await CollaboratorApi.updateStatus(row._id, next);
        updateItem({ ...updated, applicant: row.applicant, project: row.project });
    };

    const stateTransitionTemplate = (rowData: Collaborator) => {
        const state = rowData.status;
        const isOwner = (rowData?.applicant as any)._id === loggedApplicantId;
        return (<div className="flex gap-2">
            {(canVerify && isOwner && state === CollaboratorStatus.pending) &&
                <Button
                    label="Verify"
                    icon="pi pi-check"
                    severity="success"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'verify',
                            onConfirmAsync: () => updateStatus(rowData, CollaboratorStatus.verify)
                        });
                    }}
                />}

            {(canPend && isOwner && state === CollaboratorStatus.verify) &&
                <Button
                    label="Pend"
                    icon="pi pi-arrow-left"
                    severity="warning"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'pend',
                            onConfirmAsync: () => updateStatus(rowData, CollaboratorStatus.pending)
                        });
                    }}
                />
            }
        </div>);
    }

    const columns = [
        !applicant && { header: "Workspace", field: "applicant.workspace.name", sortable: true },
        !applicant && {
            header: "Collaborator",
            field: "applicant.name",
        },
        !applicant && {
            header: "Gender",
            field: "applicant.gender",
            sortable: true,
            headerStyle: { minWidth: "8rem" }
        },
        !project && {
            header: "Project",
            field: "project.title",
            sortable: true
        },
        {
            header: "Status",
            body: (row: Collaborator) => <MyBadge type="status" value={row.status ?? "Unknown"} />
        },
        { body: stateTransitionTemplate }
    ].filter(Boolean);

    return (
        <>
            <CrudManager
                headerTitle="Collaborators"
                items={collaborators}
                dataKey={applicant ? "_id" : "applicant._id"}
                //dataKey="applicant._id"
                loading={loading}
                error={error}
                columns={columns}
                canCreate={canCreate}
                //canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setSelectedCollaborator(emptyCollaborator);
                    setShowSaveDialog(true);
                }}
                onDelete={(row: Collaborator) => {
                    confirm.ask({
                        item: `${(row.applicant as Applicant).name}`,
                        onConfirm: flyMode && onRemove ? () => onRemove(row) : undefined,
                        onConfirmAsync: !flyMode ? () => deleteCollaborator(row) : undefined,
                    })
                }
                }
            />

            {project && (
                <CollaboratorDialog
                    collaborator={selectedCollaborator}
                    visible={showSaveDialog}
                    onSave={onSave}
                    onComplete={onSaveComplete}
                    onHide={() => setShowSaveDialog(false)}
                />
            )}
        </>
    );
};

export default CollaboratorManager;
