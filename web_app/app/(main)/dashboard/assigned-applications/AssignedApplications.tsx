'use client';

import { BASE_URL } from "@/api/ApiClient";
import { ItemDataTable } from "@/components/data-table/ItemDataTable";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useState } from "react";
import { ApplicationApi } from "../../applications/api/application.api";
import { Application } from "../../applications/models/application.model";
import ApplicationDetail from "../../applications/stage/ApplicationDetail";

const AssignedApplications = () => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            setLoading(true);
            try {
                const data = await ApplicationApi.getMyAssignedApplications();
                setApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching applications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);


    const columns = [
        {
            header: "Project",
            field: "project.title",
            sortable: true,
            body: (row: Application) => {
                const proj = typeof row.project === "object" && row.project !== null ? row.project : null;
                const title = proj?.title ?? (typeof row.project === "string" ? row.project : "N/A");
                return (
                    <div className="truncate text-sm font-medium text-900" title={title} style={{ maxWidth: "220px" }}>
                        {title}
                    </div>
                );
            }
        },
        {
            header: "Stage",
            field: "stage.name",
            sortable: true,
            body: (row: Application) => {
                const stage = typeof row.stage === "object" && row.stage !== null ? row.stage : null;
                const stageName = stage?.name ?? (typeof row.stage === "string" ? row.stage : "Unknown Stage");
                return <div className="capitalize font-medium text-700 text-sm">{stageName}</div>;
            }
        },

        {
            header: "Score",
            field: "totalScore",
            sortable: true,
            body: (app: Application) => (
                <span className="font-bold text-sm">
                    {typeof app?.totalScore === "number" ? app.totalScore.toFixed(2) : "-"}
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
            body: (app: Application) => app.documentPath ? (
                <a
                    href={`${BASE_URL}/${app.documentPath.replace(/^\\/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium text-sm"
                >
                    <i className="pi pi-file-pdf text-red-500"></i> View PDF
                </a>
            ) : (
                <span className="text-gray-400 italic text-xs">
                    No document
                </span>
            )
        }
    ];

    if (loading) {
        return (
            <div className="surface-card border-1 surface-border border-round-xl p-5 text-center text-500 font-medium shadow-sm">
                <i className="pi pi-spin pi-spinner text-xl mr-2"></i> Loading assigned applications...
            </div>
        );
    }

    return (
        <div className="surface-card border-1 surface-border border-round-xl overflow-hidden shadow-sm">
            <ItemDataTable
                items={applications}
                columns={columns}
                enableSearch
                expandable={{
                    template: application => (
                        <ApplicationDetail
                            application={application}
                        />
                    )
                }}
            />
        </div>
    );
};

export default AssignedApplications;