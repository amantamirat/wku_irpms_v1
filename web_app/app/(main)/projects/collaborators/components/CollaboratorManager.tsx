'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { Collaborator, GetCollaboratorsOptions, CollaboratorStatus } from "../models/collaborator.model";
import { CollaboratorApi } from "../api/collaborator.api";
//import SaveCollaborator from "./SaveCollaborator"; // You'll need to create this dialog

import { Project } from "../../models/project.model";
import MyBadge from "@/templates/MyBadge";
import { Badge } from "primereact/badge";
import SaveCollaborator from "./SaveCollaborator";
//import { COLLABORATOR_STATUS_ORDER, COLLABORATOR_TRANSITIONS } from "../models/collaborator.state-machine";

interface CollaboratorManagerProps {
    project?: Project;
}

const CollaboratorManager = ({ project }: CollaboratorManagerProps) => {
    const Manager = createEntityManager<Collaborator, GetCollaboratorsOptions | undefined>({
        title: project ? `Team: ${project.title}` : "Manage Collaborators",
        itemName: "Collaborator",
        api: CollaboratorApi,

        columns: [
            {
                header: "Applicant / Member",
                field: "applicant",
                sortable: true,
                body: (c: Collaborator) => (
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-user text-primary"></i>
                        <span>
                            {typeof c.applicant === "object" ? c.applicant?.name : "Unknown Member"}
                        </span>
                        {c.isLeadPI && (
                            <Badge value="Lead PI" severity="info" />
                        )}
                    </div>
                )
            },
            /*
            {
                header: "Email",
                body: (c: Collaborator) => (
                    <span>{typeof c.applicant === "object" ? c.applicant?.name : '-'}</span>
                )
            },
            */
            {
                header: "Role",
                field: "isLeadPI",
                body: (c: Collaborator) => (
                    <span>{c.isLeadPI ? 'Principal Investigator' : 'Co-Investigator'}</span>
                )
            },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (c: Collaborator) =>
                    <MyBadge type="status" value={c.status ?? "Pending"} />
            }
        ],

        createNew: () => ({
            project: project ?? undefined,
            applicant: undefined,
            isLeadPI: false,
            status: CollaboratorStatus.pending
        }),

        SaveDialog: SaveCollaborator,
        permissionPrefix: "collaborator",

        // This ensures the manager only shows collaborators for the current project
        query: () => ({
            project: project?._id,
            populate: true,
        }),

        /*
        workflow: {
            statusField: "status",
            transitions: COLLABORATOR_TRANSITIONS,
            statusOrder: COLLABORATOR_STATUS_ORDER
        }
            */
    });

    return <Manager />;
};

export default CollaboratorManager;