'use client';
import { Call } from "@/app/(main)/calls/models/call.model";
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useMemo, useState } from "react";
import { ProjectApi } from "../api/project.api";
import { Project, ProjectStatus } from "../models/project.model";
import ProjectDetail from "./ProjectDetail";
import SaveProjectDialog from "./SaveProjectDialog";
import { Applicant } from "../../applicants/models/applicant.model";
import { Button } from "primereact/button";
import { Organization } from "../../organizations/models/organization.model";

interface ProjectManagerProps {
    call?: Call;
    applicant?: Applicant;
    workspace?: Organization;
}

const ProjectManager = ({ call, applicant, workspace }: ProjectManagerProps) => {

    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();

    const emptyProject: Project = {
        call: call,
        title: "",
        applicant: applicant, //leadPI
    };

    // ✅ Permissions
    const canCreate = applicant && hasPermission([PERMISSIONS.PROJECT.CREATE]);
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
                const data = await ProjectApi.getProjects({ call, applicant, workspace });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch projects. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [call, applicant, workspace]);



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
            applicant: row.applicant
        });
    };


    const stateTransitionTemplate = (row: Project) => {
        const current = row.status;

        let prev: ProjectStatus | undefined = undefined;
        let next: ProjectStatus | undefined = undefined;

        if (current === ProjectStatus.accepted) {
            if (canNegotiate) {
                next = ProjectStatus.negotiation;
            }
        } else if (current === ProjectStatus.negotiation) {
            if (canApprove) {
                next = ProjectStatus.approved;
            }
            if (canNegotiate) {
                prev = ProjectStatus.accepted;
            }
        } else if (current === ProjectStatus.approved) {
            if (canGrant) {
                next = ProjectStatus.granted;
            }
            if (canApprove) {
                prev = ProjectStatus.negotiation;
            }
        } else if (current === ProjectStatus.granted) {
            if (canComplete) {
                next = ProjectStatus.completed;
            }
            if (canGrant) {
                prev = ProjectStatus.approved;
            }
        } else if (current === ProjectStatus.completed) {
            if (canComplete) {
                prev = ProjectStatus.granted;
            }
        }

        return (
            <div className="flex gap-2">
                {/* ✅ Next Button */}
                {next && (() => {
                    const nextStatus = next; // local constant for TS
                    return (
                        <Button
                            tooltip={`Make ${nextStatus}`}
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: `Make to ${nextStatus}`,
                                    onConfirmAsync: () => updateStatus(row, nextStatus),
                                });
                            }}
                        />
                    );
                })()}

                {/* ✅ Prev Button */}
                {prev && (() => {
                    const prevStatus = prev; // local constant for TS
                    return (
                        <Button
                            tooltip={`Back to ${prevStatus}`}
                            icon="pi pi-undo"
                            severity="warning"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: `Back to ${prevStatus}`,
                                    onConfirmAsync: () => updateStatus(row, prevStatus),
                                });
                            }}
                        />
                    );
                })()}
            </div>
        );
    };

    const deleteProject = async (row: Project) => {
        const deleted = await ProjectApi.delete(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setProject(emptyProject);
        setShowSaveDialog(false);
    };

    const columns = useMemo(() => {
        const cols: any[] = [];

        // If workspace context → show more structural info
        if (workspace) {
            cols.push(
                {
                    header: "Calendar",
                    field: "call.calendar.year",
                    sortable: true
                },
                {
                    header: "Directorate",
                    field: "call.directorate.name",
                    sortable: true
                }
            );
        }

        // Show Call column only if NOT inside a specific call
        if (!call) {
            cols.push({
                header: "Call",
                field: "call.title",
                sortable: true
            });
        }

        cols.push(
            {
                header: "Title",
                field: "title",
                sortable: true,
                style: { width: '250px', maxWidth: '250px' },
                body: (row: Project) => (
                    <div
                        className="truncate"
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}
                        title={row.title}
                    >
                        {row.title}
                    </div>
                )
            }
        );

        // Hide applicant column if already filtering by applicant
        if (!applicant) {

            cols.push(
                {
                    header: "Workspace",
                    field: "applicant.workspace.name",
                    sortable: true
                },
                {
                    header: "PI",
                    field: "applicant.name",
                    sortable: true
                });
        }

        cols.push({
            header: "Budget",
            field: "totalBudget",
            sortable: true,
            body: (row: Project) => {
                const budget = row?.totalBudget;
                return typeof budget === "number"
                    ? budget.toLocaleString()
                    : "-";
            }
        });

        cols.push({
            header: "Status",
            field: "status",
            sortable: true,
            body: (p: Project) =>
                <MyBadge type="status" value={p.status ?? 'Unknown'} />
        });

        cols.push({ body: stateTransitionTemplate });

        return cols;
    }, [call, applicant, workspace]);

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
                canDeleteRow={(row: Project) => row.status === ProjectStatus.pending}

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
