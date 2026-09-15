'use client';

import { BASE_URL } from "@/api/ApiClient";
import { createEntityManager } from "@/components/data-table/createEntityManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import MyBadge from "@/templates/MyBadge";
import { extractId } from "@/utils/utils";
import { useEffect, useMemo, useState } from "react";
import { StageApi } from "../../calls/stages/api/stage.api";
import { Stage } from "../../calls/stages/models/stage.model";
import { Project } from "../../projects/models/project.model";
import { ApplicationApi } from "../api/application.api";
import SaveApplication from "../components/SaveApplication";
import { AnonymizationStatus, Application, ApplicationStatus } from "../models/application.model";

interface ApplicationManagerProps {
    project: Project;
    enableEditing?: boolean;
}

const ApplicationManager = ({ project, enableEditing }: ApplicationManagerProps) => {
    const [applications, setApplications] = useState<Application[]>([]);
    //const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
    const [nextStage, setNextStage] = useState<Stage | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const confirm = useConfirmDialog();

    // Fetch applications and current stage details
    useEffect(() => {
        const loadApplicationData = async () => {
            if (!project) return;
            setLoading(true);
            try {
                // Fetch all project applications for history table
                const data = await ApplicationApi.lookup!({ project: project });
                const appList = Array.isArray(data) ? data : [];
                setApplications(appList);

                if (!enableEditing) return;

                // Determine current application ID from project
                const currentAppId =
                    extractId(project.currentApplication);

                if (currentAppId) {
                    const appDetail = await ApplicationApi.getById!(currentAppId);
                    //setCurrentApplication(appDetail);

                    // If current application is ACCEPTED, query for the next stage
                    const isAccepted = appDetail?.status === ApplicationStatus.accepted;
                    const stageId = extractId(appDetail.stage);

                    if (isAccepted && stageId) {
                        const nextStage = await StageApi.getNext(stageId);
                        setNextStage(nextStage);
                    } else {
                        setNextStage(null);
                    }
                } else {
                    //setCurrentApplication(null);
                    setNextStage(null);
                }
            } catch (error) {
                console.error("Error loading application pipeline data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadApplicationData();
    }, [project, enableEditing]);

    // Helper formatting functions
    const formatDeadline = (dateStr?: Date | string) => {
        if (!dateStr) return "No Deadline Set";
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const isDeadlinePassed = (dateStr?: Date | string) => {
        if (!dateStr) return false;
        return new Date(dateStr).getTime() < Date.now();
    };

    // Table configuration via EntityManager
    const Manager = useMemo(() => {
        return createEntityManager<Application>({
            itemName: "Application",
            api: ApplicationApi,
            columns: [
                {
                    header: "Stage",
                    field: "stage.name",
                    body: (ps: Application) => {
                        const stageName = typeof ps.stage === "object" ? ps.stage?.name : "Unknown Stage";
                        return <div className="capitalize font-medium">{stageName}</div>;
                    },
                    sortable: true
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
                    ) : <span className="text-gray-400 italic">No document</span>
                },
                {
                    header: "Score",
                    body: (ps: Application) => <span>{typeof ps?.totalScore === "number" ? ps.totalScore : "—"}</span>
                },
                {
                    header: "Status",
                    body: (app: Application) => <MyBadge type="status" value={app.status} />
                },
            ],
            createNew: nextStage
                ? () => ({
                    project: project,
                    stage: nextStage,
                    status: ApplicationStatus.pending,
                    anonymizationStatus: AnonymizationStatus.pending
                })
                : undefined,
            SaveDialog: nextStage ? SaveApplication : undefined,
            items: applications,
            permissionPrefix: "application",
            hideSearch: true,
            hideEditAction: true,
        });
    }, [applications, nextStage, project]); // Added nextStage and project to dependencies!

    if (loading) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <i className="pi pi-spin pi-spinner text-2xl text-blue-500" />
                <span className="text-gray-600 text-sm">Loading application pipeline...</span>
            </div>
        );
    }

    const expired = nextStage ? isDeadlinePassed(nextStage.deadline) : false;

    return (
        <div className="space-y-6">
            {/* Next Stage Eligibility Banner */}
            {nextStage && (
                <div className="mb-4 p-3 bg-blue-50 border-round border-1 border-blue-100">
                    <div className="flex align-items-center justify-content-between mb-2">
                        <h4 className="text-xs font-bold uppercase text-blue-600 mt-0 mb-0 tracking-wider flex align-items-center gap-2">
                            <i className="pi pi-info-circle text-xs"></i>
                            Next Eligible Stage
                        </h4>
                        {expired && (
                            <span className="text-xs font-semibold text-red-600 bg-red-100 border-round px-2 py-1">
                                Deadline Expired
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-700 m-0 line-height-3">
                        Your project is eligible to advance to <span className="font-bold text-900">{nextStage.name}</span>.
                        Please ensure all required documents are submitted before the deadline on <span className="font-semibold text-blue-900">{formatDeadline(nextStage.deadline)}</span>
                        {typeof nextStage.minAcceptanceScore === "number" && (
                            <> (Minimum passing score: <span className="font-semibold text-900">{nextStage.minAcceptanceScore} pts</span>)</>
                        )}. Use the button below to upload and complete your application.
                    </p>
                </div>
            )}

            {/* Application History Table & Manager */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h5 className="text-md font-semibold text-slate-800 dark:text-slate-200">
                        Application Submissions
                    </h5>
                </div>
                <Manager />
            </div>
        </div>
    );
};

export default ApplicationManager;