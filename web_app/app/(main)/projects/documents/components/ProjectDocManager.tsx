'use client';

import { useEffect, useState } from "react";
import { CrudManager } from "@/components/CrudManager";
import ErrorCard from "@/components/ErrorCard";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import ListSkeleton from "@/components/ListSkeleton";
import SaveProjectStageDialog from "./SaveProjectStageDialog";
import ReviewerManager from "../../reviewers/components/ReviewerManager";
import MyBadge from "@/templates/MyBadge";
import { ProjectDoc, ProjectDocStatus } from "../models/document.model";
import { ProjectDocApi } from "../api/project.doc.api";
import { Project } from "../../models/project.model";
import { useCrudList } from "@/hooks/useCrudList";
import { BASE_URL } from "@/api/ApiClient";
import { Stage } from "@/app/(main)/calls/stages/models/stage.model";

interface ProjectDocManagerProps {
    project?: Project;
    updateProjectStatus?: (project: Project) => void;
    stage?: Stage;
}

const ProjectDocManager = ({ project, updateProjectStatus, stage }: ProjectDocManagerProps) => {
    const confirm = useConfirmDialog();
    const { getLinkedApplicant } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;
    //const isLeadPI = loggedApplicantId === (project?.leadPI as any)._id;

    const emptyStage: ProjectDoc = {
        project: project ?? "",
        status: ProjectDocStatus.pending
    };

    // ✅ Permissions (adjust if needed)
    const canCreate = !!project;
    //const canEdit = true;
    const canDelete = !!project;
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

    const [selectedStage, setSelectedStage] = useState<ProjectDoc>(emptyStage);
    const [showSaveDialog, setShowSaveDialog] = useState(false);


    // ✅ Fetch project stages
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                setLoading(true);
                const data = await ProjectDocApi.getProjectDocs({ project: project });
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

    const columns = [
        { header: "Stage", field: "stage.name", sortable: true },
        { header: "Project", field: "project.title", sortable: true },
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
            body: (row: ProjectDoc) => {
                if ([ProjectDocStatus.reviewed, ProjectDocStatus.accepted, ProjectDocStatus.rejected].includes(row.status)) {
                    return row.totalScore ?? "-";
                }
                return "-";
            }
        },
        {
            header: "Status",
            body: (row: ProjectDoc) => <MyBadge type="status" value={row.status ?? "Unknown"} />
        }
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

                rowExpansionTemplate={(row) => <ReviewerManager projectStage={row}
                    updateProjectStage={onSaveComplete} showControllers />}
                enableSearch
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
