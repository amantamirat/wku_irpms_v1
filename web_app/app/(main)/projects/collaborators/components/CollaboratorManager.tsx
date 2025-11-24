"use client";

import { useEffect, useState } from "react";
import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import ErrorCard from "@/components/ErrorCard";
import ListSkeleton from "@/components/ListSkeleton";
import MyBadge from "@/templates/MyBadge";

import { CollaboratorApi } from "../api/collaborator.api";
import CollaboratorDialog from "./CollaboratorDialog";
import { Collaborator, CollaboratorStatus } from "../models/collaborator.model";
import { Project } from "../../models/project.model";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";

interface CollaboratorProps {
    project?: Project;
    onSave?: (collaborator: Collaborator) => void;
    onRemove?: (collaborator: Collaborator) => void;
}

const CollaboratorManager = ({ project, onSave, onRemove }: CollaboratorProps) => {
    const confirm = useConfirmDialog();

    const emptyCollaborator: Collaborator = {
        project: project ?? "",
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
                const data = await CollaboratorApi.getCollaborators({ project: project });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch collaborators. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [project?._id]);

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
        }
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
                enableSearch
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
