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
    const { hasPermission } = useAuth();
    //const linkedApplicant = getLinkedApplicant();
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
    const canAccept = hasPermission([PERMISSIONS.PROJECT.STATUS.ACCEPT]);
    const canNegotiate = hasPermission([PERMISSIONS.PROJECT.STATUS.NEGOTIATE]);
    const canApprove = hasPermission([PERMISSIONS.PROJECT.STATUS.APPROVE]);
    const canGrant = hasPermission([PERMISSIONS.PROJECT.STATUS.GRANT]);
    const canComplete = hasPermission([PERMISSIONS.PROJECT.STATUS.COMPLETE]);

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


    const stateTransitionTemplate = (row: Project) => {
        const current = row.status;
        let prev = undefined;
        let next = undefined;
        if (current === ProjectStatus.accepted) {
            if (canNegotiate) {
                next = ProjectStatus.negotiation;
            }
        }
        else if (current === ProjectStatus.negotiation) {
            if (canApprove) {
                next = ProjectStatus.approved;
            }
            if (canNegotiate) {
                prev = ProjectStatus.accepted;
            }
        }
        else if (current === ProjectStatus.approved) {
            if (canGrant) {
                next = ProjectStatus.granted;
            }
            if (canApprove) {
                prev = ProjectStatus.negotiation;
            }
        }
        else if (current === ProjectStatus.granted) {
            if (canComplete) {
                next = ProjectStatus.completed;
            }
            if (canGrant) {
                prev = ProjectStatus.approved
            }
        }
        else if (current === ProjectStatus.completed) {
            if (canComplete) {
                prev = ProjectStatus.granted
            }
        }


        return (<div className="flex gap-2">
            {(next)
                &&
                <Button
                    tooltip={`Make ${next}`}
                    icon="pi pi-check"
                    severity="success"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: `Make to ${next}`,
                            onConfirmAsync: () => updateStatus(row, next)
                        });
                    }}
                />
            }
            {(prev)
                &&
                <Button
                    tooltip={`Back to ${prev}`}
                    icon="pi pi-undo"
                    severity="warning"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: `back to ${prev}`,
                            onConfirmAsync: () => updateStatus(row, prev)
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
            header: "Budget", field: "totalBudget",
            body: (row: Project) => {
                const budget = row?.totalBudget;
                return typeof budget === "number"
                    ? budget.toLocaleString()
                    : "-";
            },
            sortable: true
        },
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

                canEditRow={(row: Project) => row.status === ProjectStatus.pending || row.status === ProjectStatus.negotiation}
                canDeleteRow={(row: Project) => row.status === ProjectStatus.pending || row.status === ProjectStatus.negotiation}

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

            {(project && showSaveDialog) && (
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
