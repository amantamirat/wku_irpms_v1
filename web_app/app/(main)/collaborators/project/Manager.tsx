'use client';

import MyBadge from "@/templates/MyBadge";
import { Project } from "../../projects/models/project.model";
import { CollaboratorApi } from "../api/collaborator.api";
import SaveCollaborator from "../components/SaveCollaborator";
import {
    Collaborator,
    CollaboratorStatus,
    FilterCollaboratorsOptions
} from "../models/collaborator.model";
import { createEntityManager } from "@/components/data-table/createEntityManager";

interface CollaboratorManagerProps {
    project: Project;
    enableEditing?: boolean;
}

const CollaboratorManager = ({ project, enableEditing = false }: CollaboratorManagerProps) => {
    const Manager = createEntityManager<
        Collaborator,
        FilterCollaboratorsOptions
    >({
        itemName: "Collaborator",
        api: CollaboratorApi,
        permissionPrefix: "collaborator",
        useLookup: true,
        query: () => ({ project }),

        columns: [
            {
                header: "Collaborator Name",
                field: "member.name",
                body: (r: Collaborator) =>
                    (r.member as any)?.name || "N/A"
            },
            {
                field: "role",
                header: "Role",
                sortable: true,
                body: (c: Collaborator) =>
                    c.role || "No Role Assigned"
            },
            {
                header: "Status",
                field: "status",
                sortable: true,
                body: (r: Collaborator) => (
                    <MyBadge
                        type="status"
                        value={r.status ?? "Unknown"}
                    />
                )
            }
        ],

        createNew: () => ({
            project,
            isLeadPI: false,
            status: CollaboratorStatus.pending
        }),

        SaveDialog: SaveCollaborator,

        hideSearch: true,
        hideEditAction: true,

        hideDefaultActions: !enableEditing
    });

    return <Manager key={project?._id} />;
};

export default CollaboratorManager;