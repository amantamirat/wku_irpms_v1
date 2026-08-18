'use client';

import { BASE_URL } from "@/api/ApiClient";
import { createEntityManager } from "@/components/createEntityManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useMemo, useState } from "react";
import { Stage } from "../../calls/stages/models/stage.model";
import { ApplicationApi } from "../api/application.api";
import { AnonymizationStatus, Application, ApplicationStatus } from "../models/application.model";
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
                    header: "Project",
                    field: "project.title",
                    body: (ps: Application) => {
                        const title = typeof ps.project === "object" ? ps.project.title : "Unknown Project";
                        return (
                            <div className="truncate max-w-xs text-sm font-medium" title={title}>
                                {title}
                            </div>
                        );
                    },
                    sortable: true
                },
                {
                    header: "Orig Doc",
                    body: (ps: Application) => ps.documentPath ? (
                        <a
                            href={`${BASE_URL}/${ps.documentPath.replace(/^\\/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            <i className="pi pi-file-pdf text-red-500 text-sm"></i>
                            <span>View PDF</span>
                        </a>
                    ) : (
                        <span className="text-gray-400 text-xs italic">No document</span>
                    )
                },
                {
                    header: "Anon Doc",
                    body: (app: Application) => app.anonymizedDocumentPath ? (
                        <a
                            href={`${BASE_URL}/${app.anonymizedDocumentPath.replace(/^\\/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                        >
                            <i className="pi pi-file-pdf text-emerald-500 text-sm"></i>
                            <span>View PDF</span>
                        </a>
                    ) : (
                        <span className="text-gray-400 text-xs italic">N/A</span>
                    )
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
            onTransitComplete: (item) => {
                setApplications((prev) =>
                    prev.map((app) => (app._id === item._id ? {
                        ...app, totalScore:
                            (item.status === ApplicationStatus.pending && item.totalScore === null) ?
                                null : item.totalScore, status: item.status
                    } : app))
                );
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
                    disabled: (row: Application) =>
                        row.status !== ApplicationStatus.pending,

                    onClick: (row: Application) => {
                        confirm.ask({
                            operation: "calculate score",
                            onConfirmAsync: async () => {
                                const score =
                                    await ApplicationApi.calculateTotalScore(
                                        row._id!
                                    );

                                setApplications((prev) =>
                                    prev.map((app) =>
                                        app._id === row._id
                                            ? {
                                                ...app,
                                                totalScore: score
                                            }
                                            : app
                                    )
                                );
                            }
                        });
                    }
                },
                // Anonymize Action
                {
                    icon: "pi pi-eye-slash",
                    severity: "warning",
                    tooltip: "Anonymize Document",
                    permissions: ["application:calculateTotalScore"],

                    disabled: (row: Application) =>
                        row.anonymizationStatus !==
                        AnonymizationStatus.pending,

                    onClick: (row: Application) => {
                        confirm.ask({
                            operation: "anonymize document",
                            onConfirmAsync: async () => {
                                const updated =
                                    await ApplicationApi.anonymize(
                                        row._id!
                                    );

                                setApplications((prev) =>
                                    prev.map((app) =>
                                        app._id === row._id
                                            ? {
                                                ...app,
                                                anonymizationStatus:
                                                    updated.anonymizationStatus,
                                                anonymizedDocumentPath:
                                                    updated.anonymizedDocumentPath
                                            }
                                            : app
                                    )
                                );
                            }
                        });
                    }
                }
            ],
        });
    }, [applications, confirm]);

    if (loading) {
        return <div className="p-4 text-center">Loading applications...</div>;
    }

    return <Manager />;
};

export default ApplicationManager;