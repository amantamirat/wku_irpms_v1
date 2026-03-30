'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator, CollaboratorStatus, GetCollaboratorsOptions } from "../models/collaborator.model";
import MyBadge from "@/templates/MyBadge";
import { Badge } from "primereact/badge";
import { Project } from "../../models/project.model";
import { COLLAB_STATUS_ORDER, COLLAB_TRANSITIONS } from "../models/collaborator.state-machine";
import SaveCollaborator from "./SaveCollaborator";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";

interface CollaboratorManagerProps {
    project?: Project;
    applicant?: Applicant;
}

const CollaboratorManager = ({ project, applicant }: CollaboratorManagerProps) => {
    // Define columns dynamically based on whether props are provided
    const columns = [];

    if (!project) {
        columns.push({
            header: "Project",
            field: "project.title",
            sortable: true,
            body: (c: Collaborator) => (
                <span>{typeof c.project === "object" ? c.project?.title : "No Project"}</span>
            )
        });
    }

    if (!applicant) {
        columns.push({
            header: "Member",
            field: "applicant.name",
            sortable: true,
            body: (c: Collaborator) => (
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-user text-primary"></i>
                    <span>{typeof c.applicant === "object" ? c.applicant?.name : "Unknown Member"}</span>
                    {c.isLeadPI && (
                        <Badge value="Lead PI" severity="info" />
                    )}
                </div>
            )
        });
    }


    columns.push(
        {
            field: "status",
            header: "Status",
            sortable: true,
            body: (c: Collaborator) =>
                <MyBadge type="status" value={c.status ?? "Pending"} />
        }
    );

    const Manager = createEntityManager<Collaborator, GetCollaboratorsOptions | undefined>({
        title: project ? `Team: ${project.title}` : "Manage Collaborators",
        itemName: "Collaborator",
        api: CollaboratorApi,
        columns,
        createNew: project
            ? () => ({
                project: project,
                applicant: applicant ?? undefined,
                isLeadPI: false,
                status: CollaboratorStatus.pending
            })
            : undefined,
        SaveDialog: project ? SaveCollaborator : undefined,
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

        disableDeleteRow: (row) => row.status === CollaboratorStatus.verified

    });

    return <Manager />;
};

export default CollaboratorManager;