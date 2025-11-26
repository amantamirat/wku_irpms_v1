'use client';
import { Cycle } from "@/app/(main)/cycles/models/cycle.model";
import { CrudManager } from "@/components/CrudManager";
import ErrorCard from "@/components/ErrorCard";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { ProjectApi } from "../api/project.api";
import { Project, GetProjectsOptions } from "../models/project.model";
import { useCrudList } from "@/hooks/useCrudList";
import ListSkeleton from "@/components/ListSkeleton";
import SaveProjectDialog from "./SaveProjectDialog";
import MyBadge from "@/templates/MyBadge";
import ProjectDetail from "./ProjectDetail";

interface ProjectManagerProps {
    cycle?: Cycle;
}

const ProjectManager = ({ cycle }: ProjectManagerProps) => {
    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const emptyProject: Project = {
        cycle: cycle,
        title: ""
    };

    // ✅ Permissions
    const canCreate = hasPermission([PERMISSIONS.PROJECT.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.PROJECT.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.PROJECT.DELETE]);

    // ✅ State + CRUD Hook
    const {
        items: projects,
        updateItem,
        removeItem,
        setAll,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Project>();

    const [project, setProject] = useState<Project>(emptyProject);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [expandedRows, setExpandedRows] = useState<any[]>([]);

    // ✅ Fetch projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const options: GetProjectsOptions = { cycle };
                const data = await ProjectApi.getProjects(options);
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch projects. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [cycle]);

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

    // ✅ Save / update
    const onSaveComplete = (savedProject: Project) => {
        updateItem(savedProject);
        hideSaveDialog();
    };

    const deleteProject = async (row: Project) => {
        const deleted = await ProjectApi.deleteProject(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setProject(emptyProject);
        setShowSaveDialog(false);
    };

    const columns = [
        { header: "Cycle", field: "cycle.title" },
        { header: "Title", field: "title" },
        {
            header: "Status", field: "status", body: (p: Project) =>
                <MyBadge type="status" value={p.status ?? 'Unknown'} />
        }
    ];

    return (
        <>
            <CrudManager
                itemName="Project"
                headerTitle="Projects"
                items={projects}
                dataKey="_id"
                columns={columns}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setProject(emptyProject); setShowSaveDialog(true); }}
                onEdit={(row) => { setProject(row); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: row.title, onConfirmAsync: () => deleteProject(row) })}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={(row) => {
                    return <ProjectDetail project={row} updateProjectStatus={updateItem} />;
                }}
                enableSearch
            />

            {project && (
                <SaveProjectDialog
                    visible={showSaveDialog}
                    project={project}
                    onComplete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            )}
        </>
    );
};

export default ProjectManager;
