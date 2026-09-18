'use client';

import { BASE_URL } from "@/api/ApiClient";
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { extractId } from "@/utils/utils";
import { ApplicationApi } from "../api/application.api";
import { Application, FilterApplicationOptions } from "../models/application.model";
import { Project } from "../../projects/models/project.model";

interface ApplicationManagerProps {
    project: string | Project;
    enableEditing?: boolean;
}

const ApplicationManager = ({
    project,
    enableEditing
}: ApplicationManagerProps) => {
    const projectId = extractId(project);

    const Manager = createEntityManager<Application, FilterApplicationOptions>({
        itemName: "Application",
        api: ApplicationApi,
        useLookup: true,
        query: () => ({ project }),
        columns: [
            {
                header: "Stage",
                field: "stage.name",
                sortable: true,
                body: (ps: Application) => {
                    const stageName = typeof ps.stage === "object" ? ps.stage?.name : "Unknown Stage";
                    return <div className="capitalize font-medium">{stageName}</div>;
                }
            },
            {
                header: "Score",
                body: (app: Application) => (
                    <span className="font-bold text-sm">
                        {typeof app?.totalScore === "number" ? app.totalScore : "—"}
                    </span>
                )
            },
            {
                header: "Status",
                field: "status",
                sortable: true,
                body: (app: Application) => (
                    <MyBadge type="status" value={app.status ?? "submitted"} />
                )
            },
            {
                header: "Document",
                body: (ps: Application) => ps.documentPath ? (
                    <a
                        href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium text-sm"
                    >
                        <i className="pi pi-file-pdf text-red-500"></i> View PDF
                    </a>
                ) : (
                    <span className="text-gray-400 italic">
                        No document
                    </span>
                )
            }
        ],
        permissionPrefix: "application",
        hideSearch: true,
        hideEditAction: true,
        hideDeleteAction: !enableEditing
    });

    return <Manager key={projectId} />;
};

export default ApplicationManager;