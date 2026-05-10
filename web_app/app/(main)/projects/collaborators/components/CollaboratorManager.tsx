'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator, CollaboratorStatus, GetCollaboratorsOptions } from "../models/collaborator.model";
import MyBadge from "@/templates/MyBadge";
import { Badge } from "primereact/badge";
import { Project, ProjectStatus } from "../../models/project.model"; // Ensure ProjectStatus is imported
import { COLLAB_STATUS_ORDER, COLLAB_TRANSITIONS } from "../models/collaborator.state-machine";
import SaveCollaborator from "./SaveCollaborator";
import { User } from "@/app/(main)/users/models/user.model";

interface CollaboratorManagerProps {
    project?: Project;
    applicant?: User;
}

const CollaboratorManager = ({ project, applicant }: CollaboratorManagerProps) => {

    // 1. Logic: Determine if adding collaborators is allowed based on Project Status
    // We allow adding if the project is in 'draft' or 'finalization' (formerly negotiation)
    const canManageTeam = project && (
        project.status === ProjectStatus.draft ||
        project.status === ProjectStatus.finalization
    );

    const columns = [];

    if (!applicant) {
        columns.push({
            header: "Member",
            field: "applicant.name",
            sortable: true,
            body: (c: Collaborator) => (
                <div className="flex align-items-center gap-2">
                    <span className="font-medium">
                        {typeof c.applicant === "object" ? c.applicant?.name : "Unknown Member"}
                    </span>
                    {c.isLeadPI && (
                        <Badge value="Lead PI" severity="info" />
                    )}
                </div>
            )
        });
    }

    if (!project) {
        columns.push({
            header: "Project",
            field: "project.title",
            sortable: true,
            body: (c: Collaborator) => (
                <div className="truncate text-sm" style={{ maxWidth: '250px' }}>
                    {typeof c.project === "object" ? c.project?.title : "Loading ..."}
                </div>
            )
        });

        columns.push({
            header: "Lead PI",
            field: "project.applicant.name",
            sortable: true,
            body: (c: Collaborator) => {
                const applicant =
                    typeof c.project === "object" &&
                        c.project &&
                        typeof c.project.applicant === "object"
                        ? c.project.applicant
                        : null;
                return (
                    <div
                        className="truncate text-sm"
                        style={{ maxWidth: "250px" }}
                    >
                        {applicant?.name ?? "Loading..."}
                    </div>
                );
            }
        });
    }

    columns.push(
        {
            field: "role",
            header: "Role",
            sortable: true,
            body: (c: Collaborator) => (
                <span className="capitalize">
                    {c.role || "No Role Assigned"}
                </span>
            )
        },
        {
            field: "status",
            header: "Status",
            sortable: true,
            body: (c: Collaborator) =>
                <MyBadge type="status" value={c.status ?? "Pending"} />
        }
    );

    const Manager = createEntityManager<Collaborator, GetCollaboratorsOptions | undefined>({
        title: project ? 'Project Team' : "Collaborators",
        itemName: "Collaborator",
        api: CollaboratorApi,
        columns,

        // 2. Conditional Action: Only provide 'createNew' if project status allows it
        createNew: canManageTeam
            ? () => ({
                project: project,
                applicant: applicant ?? undefined,
                isLeadPI: false,
                status: CollaboratorStatus.pending
            })
            : undefined,

        // 3. Conditional UI: Hide Dialog if the project is locked (not in submitted/finalization)
        SaveDialog: canManageTeam ? SaveCollaborator : undefined,

        permissionPrefix: "collaborator",
        query: () => ({
            project,
            applicant,
            populate: true,
        }),
        workflow: applicant ? {
            statusField: "status",
            transitions: COLLAB_TRANSITIONS,
            statusOrder: COLLAB_STATUS_ORDER
        } : undefined,

        // If we can't manage the team, we should hide default actions (Edit/Delete)
        hideDefaultActions: !canManageTeam,
        disableDeleteRow: (row) => row.status === CollaboratorStatus.verified,
        hideSearch: !!project
    });

    return <Manager />;
};

export default CollaboratorManager;