'use client';

import { useAuth } from "@/contexts/auth-context";
import { etbCurrencyFormatter } from "@/utils/utils";
import { ProgressBar } from "primereact/progressbar";
import { ProgressSpinner } from "primereact/progressspinner";
import { useEffect, useState } from "react";
import { ProjectApi } from "../api/project.api";

export interface IProjectProgress {
    activityProgress: number;
    costProgress: number;
    phaseProgress: number;

    totalActivities: number;
    completedActivities: number;

    totalPhases: number;
    completedPhases: number;

    totalCost: number;
    completedCost: number;
}

interface ProjectProgressProps {
    projectId: string;
}

export default function ProjectProgress({ projectId }: ProjectProgressProps) {
    const { hasPermission } = useAuth();
    const [progress, setProgress] = useState<IProjectProgress | null>(null);
    const [loadingProgress, setLoadingProgress] = useState<boolean>(true);

    useEffect(() => {
        if (!projectId || !hasPermission(["project:read"])) {
            setLoadingProgress(false);
            return;
        }

        setLoadingProgress(true);
        ProjectApi.getProgress(projectId)
            .then((data) => {
                setProgress(data);
            })
            .catch((err) => {
                console.error("Failed to load project progress:", err);
            })
            .finally(() => {
                setLoadingProgress(false);
            });
    }, [projectId]);

    if (!hasPermission(["project:read"])) {
        return null;
    }

    return (
        <div className="surface-ground border-round p-3 mb-4 mt-3">
            <div className="flex align-items-center justify-content-between mb-3">
                <span className="font-bold text-900 text-lg flex align-items-center gap-2">
                    <i className="pi pi-chart-line text-primary"></i> Project Progress Overview
                </span>
                {loadingProgress && <ProgressSpinner style={{ width: '20px', height: '20px' }} strokeWidth="4" />}
            </div>

            <div className="grid">
                {/* Phase Progress (Blue Theme) */}
                <div className="col-12 md:col-4 p-2">
                    <div className="surface-card p-3 border-round shadow-sm h-full border-left-3 border-blue-500">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-600 font-medium text-sm flex align-items-center gap-2">
                                <i className="pi pi-list text-blue-500"></i> Phase Progress
                            </span>
                            <span className="font-bold text-900 text-xl">{progress?.phaseProgress ?? 0}%</span>
                        </div>
                        <ProgressBar value={progress?.phaseProgress ?? 0} showValue={false} style={{ height: '6px' }} />
                        <div className="text-500 text-xs mt-2">
                            Completed {progress?.completedPhases ?? 0} of {progress?.totalPhases ?? 0} phases
                        </div>
                    </div>
                </div>

                {/* Activity Progress (Purple Theme) */}
                <div className="col-12 md:col-4 p-2">
                    <div className="surface-card p-3 border-round shadow-sm h-full border-left-3 border-purple-500">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-600 font-medium text-sm flex align-items-center gap-2">
                                <i className="pi pi-check-circle text-purple-500"></i> Activity Progress
                            </span>
                            <span className="font-bold text-900 text-xl">{progress?.activityProgress ?? 0}%</span>
                        </div>
                        <ProgressBar value={progress?.activityProgress ?? 0} showValue={false} style={{ height: '6px' }} />
                        <div className="text-500 text-xs mt-2">
                            Completed {progress?.completedActivities ?? 0} of {progress?.totalActivities ?? 0} activities
                        </div>
                    </div>
                </div>

                {/* Cost Progress (Green Theme) */}
                <div className="col-12 md:col-4 p-2">
                    <div className="surface-card p-3 border-round shadow-sm h-full border-left-3 border-green-500">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-600 font-medium text-sm flex align-items-center gap-2">
                                <i className="pi pi-wallet text-green-500"></i> Cost Progress
                            </span>
                            <span className="font-bold text-900 text-xl">{progress?.costProgress ?? 0}%</span>
                        </div>
                        <ProgressBar value={progress?.costProgress ?? 0} showValue={false} style={{ height: '6px' }} />
                        <div className="text-500 text-xs mt-2">
                            Spent {etbCurrencyFormatter.format(progress?.completedCost ?? 0)} / {etbCurrencyFormatter.format(progress?.totalCost ?? 0)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}