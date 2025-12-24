'use client';
import { Call } from "@/app/(main)/calls/models/call.model";
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";
import { ProjectApi } from "../api/project.api";
import { Project, ProjectStatus } from "../models/project.model";
import ProjectDetail from "./ProjectDetail";
import SaveProjectDialog from "./SaveProjectDialog";
import { Applicant } from "../../applicants/models/applicant.model";
import { Button } from "primereact/button";

interface ProjectManagerProps {
    call?: Call;
    leadPI?: Applicant;
}

const ProjectManager = ({ call, leadPI }: ProjectManagerProps) => {

    const confirm = useConfirmDialog();
    const { getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    //const isOwner = linkedApplicant?._id === leadPI?._id;

    const emptyProject: Project = {
        call: call,
        title: "",
        leadPI: "", //leadPI
    };

    // ✅ Permissions
    const canCreate = hasPermission([PERMISSIONS.PROJECT.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.PROJECT.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.PROJECT.DELETE]);
    // State permissions
    const canNegotiate = hasPermission([PERMISSIONS.PROJECT.STATUS.NEGOTIATE]);
    const canAccept = hasPermission([PERMISSIONS.PROJECT.STATUS.ACCEPT]);

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

    const updateStatus = async (row: Project, next: ProjectStatus) => {
        if (!row._id) {
            return;
        }
        const updated = await ProjectApi.updateStatus(row._id, next);
        onSaveComplete({
            ...updated,
            call: row.call,
            leadPI: row.leadPI
        });
    };


    const stateTransitionTemplate = (rowData: Project) => {
        const state = rowData.status;
        return (<div className="flex gap-2">
            {(canNegotiate && state === ProjectStatus.accepted)
                &&
                <Button
                    tooltip="Negotiate"
                    icon="pi pi-bitcoin"
                    severity="success"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'Negotiate',
                            onConfirmAsync: () => updateStatus(rowData, ProjectStatus.negotiation)
                        });
                    }}
                />
            }
            {(canAccept && state === ProjectStatus.negotiation) &&
                <Button
                    tooltip="Back to accept"
                    icon="pi pi-undo"
                    severity="warning"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'back to activate',
                            onConfirmAsync: () => updateStatus(rowData, ProjectStatus.accepted)
                        });
                    }}
                />
            }
        </div>);
    }

    const deleteProject = async (row: Project) => {
        const deleted = await ProjectApi.delete(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setProject(emptyProject);
        setShowSaveDialog(false);
    };

    const columns = [
        { header: "Call", field: "call.title", sortable: true },
        { header: "Title", field: "title", sortable: true },
        { header: "Lead PI", field: "leadPI.name", sortable: true },
        {
            header: "Status", field: "status", sortable: true,
            body: (p: Project) =>
                <MyBadge type="status" value={p.status ?? 'Unknown'} />
        },
        { body: stateTransitionTemplate }
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
