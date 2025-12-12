'use client';
import { Call } from "@/app/(main)/calls/models/call.model";
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { Applicant } from "../../applicants/models/applicant.model";
import { ProjectApi } from "../api/project.api";
import { Project } from "../models/project.model";
import ProjectDetail from "./ProjectDetail";
import SaveProjectDialog from "./SaveProjectDialog";

interface ProjectManagerProps {
    call?: Call;
    leadPI?: Applicant;
}

const ProjectManager = ({ call, leadPI }: ProjectManagerProps) => {
    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const emptyProject: Project = {
        call: call,
        title: "",
        leadPI: leadPI
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


    // ✅ Fetch projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const data = await ProjectApi.getProjects({ call, leadPI });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch projects. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [call, leadPI]);



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
        { header: "Call", field: "call.title" },
        { header: "Title", field: "title" },
        { header: "Lead PI", field: "leadPI.name" },
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
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setProject(emptyProject); setShowSaveDialog(true); }}
                onEdit={(row) => { setProject(row); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: row.title, onConfirmAsync: () => deleteProject(row) })}
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
