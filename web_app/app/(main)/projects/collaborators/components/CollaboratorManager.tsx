"use client";

import { CrudManager } from "@/components/CrudManager";
import ErrorCard from "@/components/ErrorCard";
import ListSkeleton from "@/components/ListSkeleton";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useState } from "react";

import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "primereact/button";
import { Project } from "../../models/project.model";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator, CollaboratorStatus } from "../models/collaborator.model";
import CollaboratorDialog from "./CollaboratorDialog";

interface CollaboratorProps {
    project?: Project;
    applicant?: Applicant;
    onSave?: (collaborator: Collaborator) => void;
    onRemove?: (collaborator: Collaborator) => void;
}

const CollaboratorManager = ({ project, applicant, onSave, onRemove }: CollaboratorProps) => {
    const confirm = useConfirmDialog();
    const { getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;

    const emptyCollaborator: Collaborator = {
        project: project ?? "",
        applicant: applicant ?? "",
        status: CollaboratorStatus.pending
    };

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

        fetchData();
    }, [project, applicant]);

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

    // Save or update collaborator
    const onSaveComplete = (saved: Collaborator) => {
        updateItem(saved);
        if (onSave) onSave(saved);
        setSelectedCollaborator(emptyCollaborator);
        setShowSaveDialog(false);
    };

    // Delete collaborator
    const deleteCollaborator = async (row: Collaborator) => {
        const deleted = await CollaboratorApi.deleteCollaborator(row);
        if (deleted) {
            removeItem(row);
            if (onRemove) onRemove(row);
        }
    };

    const updateStatus = async (row: Collaborator, next: CollaboratorStatus) => {
        const updated = await CollaboratorApi.updateCollaborator({ _id: row._id, status: next }, true);
        updateItem({ ...updated, applicant: row.applicant, project: row.project });
    };

    const stateTransitionTemplate = (rowData: Collaborator) => {
        const state = rowData.status;
        const isOwner = (rowData?.applicant as any)._id === loggedApplicantId;
        return (<div className="flex gap-2">
            {(isOwner && state === CollaboratorStatus.pending) &&
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

            {(isOwner && state === CollaboratorStatus.verify) &&
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
        /**
         *  {
            header: "#", body: (_: any, { rowIndex }: any) => rowIndex + 1,
        },
         */

        { header: "Workspace", field: "applicant.organization.name", sortable: true },
        {
            header: "Collaborator",
            body: (row: Collaborator) =>
                `${(row.applicant as Applicant).first_name} ${(row.applicant as Applicant).last_name}`
        },
        {
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
                dataKey="_id"
                columns={columns}
                canCreate={!!project}
                canDelete={!!project}
                //enableSearch
                onCreate={() => {
                    setSelectedCollaborator(emptyCollaborator);
                    setShowSaveDialog(true);
                }}
                onDelete={(row: Collaborator) =>
                    confirm.ask({
                        item: `${(row.applicant as Applicant).first_name}`,
                        onConfirmAsync: () => deleteCollaborator(row),
                    })
                }
            />

            {project && (
                <CollaboratorDialog
                    collaborator={selectedCollaborator}
                    visible={showSaveDialog}
                    onComplete={onSaveComplete}
                    onHide={() => setShowSaveDialog(false)}
                />
            )}
        </>
    );
};

export default CollaboratorManager;
