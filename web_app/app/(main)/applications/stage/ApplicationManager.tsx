'use client';

import { BASE_URL } from "@/api/ApiClient";
import { createEntityManager } from "@/components/createEntityManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useMemo, useState } from "react";
import { Stage } from "../../calls/stages/models/stage.model";
import { ApplicationApi } from "../api/application.api";
import { Application, ApplicationStatus } from "../models/application.model";
import { APPLICATION_STATUS_ORDER, APPLICATION_TRANSITIONS } from "../models/application.state-machine";
import ApplicationDetail from "./ApplicationDetail";

interface ApplicationManagerProps {
    stage: Stage;
}

const ApplicationManager = ({ stage }: ApplicationManagerProps) => {
    const confirm = useConfirmDialog();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!stage) return;
            setLoading(true);
            try {
                const data = await ApplicationApi.getAll({ stage }, true);
                setApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching applications for stage:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [stage]);

    // useMemo prevents component re-creation on every render cycle
    const Manager = useMemo(() => {
        return createEntityManager<Application>({
            title: "Applications",
            itemName: "Application",
            api: ApplicationApi,
            columns: [
                {
                    header: "Project", field: "project.title",
                    body: (ps: Application) => {
                        const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                        return <div
                            className="truncate max-w-xs text-sm font-medium"
                            title={title}>{title}</div>;
                    },
                    sortable: true
                },
                {
                    header: "Document",
                    body: (ps: Application) => ps.documentPath ? (
                        <a href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                            <i className="pi pi-file-pdf mr-1 text-red-500"></i> View PDF
                        </a>
                    ) : <span className="text-gray-400 italic">No document</span>
                },
                {
                    header: "Score",
                    body: (app: Application) => <span className="font-bold">{typeof app?.totalScore === "number" ? app.totalScore : "—"}</span>
                },
                {
                    header: "Status",
                    body: (app: Application) => <MyBadge type="status" value={app.status} />
                },
            ],
            items: applications,
            permissionPrefix: "application",
            workflow: {
                statusField: "status",
                statusOrder: APPLICATION_STATUS_ORDER,
                transitions: APPLICATION_TRANSITIONS
            },
            hideEditAction: true,
            disableDeleteRow: (row: Application) => row.status !== ApplicationStatus.pending,
            expandable: {
                template: (app) => <ApplicationDetail application={app} />
            },
            extraActions: [
                {
                    icon: "pi pi-calculator",
                    severity: "info",
                    tooltip: "Recalculate Scores",
                    permissions: ["application:calculateTotalScore"],
                    disabled: (row: Application) => row.status !== ApplicationStatus.pending,
                    onClick: (row: Application) => {
                        confirm.ask({
                            operation: "calculate score",
                            onConfirmAsync: async () => {
                                const score = await ApplicationApi.calculateTotalScore(row._id!);
                                row.totalScore = score;
                            }
                        });
                    }
                }
            ],
        });
    }, [applications]);

    if (loading) {
        return <div className="p-4 text-center">Loading applications...</div>;
    }

    return <Manager />;
};

export default ApplicationManager;