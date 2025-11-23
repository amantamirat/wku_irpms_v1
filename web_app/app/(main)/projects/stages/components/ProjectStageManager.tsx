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
import { ProjectStage, ProjectStageStatus } from "../models/stage.model";
import { ProjectStageApi } from "../api/project.stage.api";
import { Project } from "../../models/project.model";
import { useCrudList } from "@/hooks/useCrudList";
import { BASE_URL } from "@/api/ApiClient";
import { Stage } from "@/app/(main)/cycles/stages/models/stage.model";

interface ProjectStageManagerProps {
    project?: Project;
    updateProjectStatus?: (project: Project) => void;
    stage?: Stage;
}

const ProjectStageManager = ({ project, updateProjectStatus, stage }: ProjectStageManagerProps) => {
    const confirm = useConfirmDialog();
    const { getLinkedApplicant } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;

    const emptyStage: ProjectStage = {
        project: project ?? "",
        status: ProjectStageStatus.pending
    };

    // ✅ Permissions (adjust if needed)
    const canCreate = !!project;
    //const canEdit = true;
    const canDelete = !!project;

    // ✅ State + CRUD Hook
    const {
        items: stages,
        updateItem,
        removeItem,
        setAll,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<ProjectStage>();

    const [selectedStage, setSelectedStage] = useState<ProjectStage>(emptyStage);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[]>([]);

    // ✅ Fetch project stages
    useEffect(() => {
        const fetchStages = async () => {
            try {
                setLoading(true);
                const data = await ProjectStageApi.getProjectStages({ project: project?._id });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch project stages. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchStages();
    }, [project?._id]);

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

    // ✅ Save / update
    const onSaveComplete = (savedStage: ProjectStage, syncedProject?: Project) => {
        updateItem(savedStage);
        if (updateProjectStatus) {
            if (project && syncedProject) {
                updateProjectStatus({ ...project, status: syncedProject.status })
            }
        }
        hideSaveDialog();
    };

    const deleteStage = async (row: ProjectStage) => {
        const deleted = await ProjectStageApi.deleteProjectStage(row);
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
            body: (row: ProjectStage) => {
                if (!row.documentPath) return "No document";
                const url = `${BASE_URL}/${row.documentPath.replace(/^\\/, "")}`;
                return <button className="p-button p-button-text" onClick={() => window.open(url, "_blank")}>View</button>;
            }
        },
        {
            header: "Score",
            body: (row: ProjectStage) => {
                if ([ProjectStageStatus.reviewed, ProjectStageStatus.accepted, ProjectStageStatus.rejected].includes(row.status)) {
                    return row.totalScore ?? "-";
                }
                return "-";
            }
        },
        {
            header: "Status",
            body: (row: ProjectStage) => <MyBadge type="status" value={row.status ?? "Unknown"} />
        }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Project Stages"
                items={stages}
                dataKey="_id"
                columns={columns}
                canCreate={canCreate}
                canDelete={canDelete}
                onCreate={() => { setSelectedStage(emptyStage); setShowSaveDialog(true); }}
                onDelete={(row: any) => confirm.ask({ item: row.stage?.name ?? "", onConfirmAsync: () => deleteStage(row) })}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
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

export default ProjectStageManager;
