'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator, CollaboratorStatus, GetCollaboratorsOptions } from "../models/collaborator.model";
import MyBadge from "@/templates/MyBadge";
import { Badge } from "primereact/badge";
import { Project, ProjectStatus } from "../../projects/models/project.model";
import { COLLAB_STATUS_ORDER, COLLAB_TRANSITIONS } from "../models/collaborator.state-machine";
import SaveCollaborator from "./SaveCollaborator";
import { User } from "@/app/(main)/users/models/user.model";
import { useMemo } from "react";

interface CollaboratorManagerProps {
    project?: Project;
    member?: User;
    collaborations?: Collaborator[]; 
    onItemsChange?: (items: Collaborator[]) => void;
    hideSearch?: boolean; // Added this
}

const CollaboratorManager = ({ 
    project, 
    member: member, 
    collaborations, 
    onItemsChange,
    hideSearch 
}: CollaboratorManagerProps) => {

    const canManageTeam = useMemo(() => project && (
        project.status === ProjectStatus.draft ||
        project.status === ProjectStatus.accepted
    ), [project?.status]);

    const columns = useMemo(() => {
        const cols: any[] = [];

        if (!member) {
            cols.push({
                header: "Member",
                field: "member.name",
                sortable: true,
                body: (c: Collaborator) => (
                    <div className="flex align-items-center gap-2">
                        <span className="font-medium">
                            {typeof c.member === "object" ? c.member?.name : "Unknown Member"}
                        </span>
                        {c.isLeadPI && <Badge value="Lead PI" severity="info" />}
                    </div>
                )
            });
        }

        if (!project) {
            cols.push({
                header: "Project",
                field: "project.title",
                sortable: true,
                body: (c: Collaborator) => (
                    <div className="truncate text-sm" style={{ maxWidth: '250px' }}>
                        {typeof c.project === "object" ? c.project?.title : "Loading ..."}
                    </div>
                )
            });

            cols.push({
                header: "PI",
                field: "project.applicant.name",
                sortable: true,
                body: (c: Collaborator) => {
                    const lead = typeof c.project === "object" ? c.project?.leadPI : null;
                    return (
                        <div className="truncate text-sm" style={{ maxWidth: "250px" }}>
                            {(lead as any)?.name ?? "Loading..."}
                        </div>
                    );
                }
            });
        }

        cols.push(
            {
                field: "role",
                header: "Role",
                sortable: true,
                body: (c: Collaborator) => (
                    <span className="capitalize">{c.role || "No Role Assigned"}</span>
                )
            },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (c: Collaborator) => <MyBadge type="status" value={c.status ?? "Pending"} />
            }
        );
        return cols;
    }, [member, project]);

    const Manager = useMemo(() => 
        createEntityManager<Collaborator, GetCollaboratorsOptions | undefined>({
            title: project ? 'Project Team' : "Collaborators",
            itemName: "Collaborator",
            api: CollaboratorApi,
            columns,
            items: collaborations, // 👈 Passes the pre-fetched list
            onItemsChange,
            createNew: canManageTeam
                ? () => ({
                    project: project,
                    member: member ?? undefined,
                    isLeadPI: false,
                    status: CollaboratorStatus.pending
                })
                : undefined,

            SaveDialog: canManageTeam ? SaveCollaborator : undefined,
            permissionPrefix: "collaborator",
            query: () => ({
                project: project?._id,
                member: member?._id,
                populate: true,
            }),
            workflow: member ? {
                statusField: "status",
                transitions: COLLAB_TRANSITIONS,
                statusOrder: COLLAB_STATUS_ORDER
            } : undefined,

            hideDefaultActions: !canManageTeam,
            disableDeleteRow: (row) => row.status === CollaboratorStatus.verified,
            hideSearch: hideSearch || !!project
        }), 
    [columns, project, member, collaborations, canManageTeam, hideSearch, onItemsChange]);

    return <Manager />;
};

export default CollaboratorManager;