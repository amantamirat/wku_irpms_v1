'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Phase, GetPhaseOptions, PhaseStatus } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";
import MyBadge from "@/templates/MyBadge";
import { Project, ProjectStatus } from "../../models/project.model";
import { PHASE_TRANSITIONS, PHASE_STATUS_ORDER } from "../models/phase.state-machine";
import SavePhase from "./SavePhase";
import { useState, useMemo, useRef, useCallback } from "react";

interface PhaseManagerProps {
    project?: Project;
    updateProject?: (project: Project) => void;
}

const PhaseManager = ({ project, updateProject }: PhaseManagerProps) => {

    const canManagePhases = useMemo(() => project && (
        project.status === ProjectStatus.draft ||
        project.status === ProjectStatus.finalization
    ), [project?.status]);
    // We only care about the ID for the API query
    const projectId = project?._id;

    // Use a ref for the callback so the Manager never has to re-render when updateProject changes
    const updateProjectRef = useRef(updateProject);
    updateProjectRef.current = updateProject;

    const handleItemsChange = useCallback((newPhases: Phase[]) => {
        if (!project || !updateProjectRef.current) return;

        // 1. Calculate Totals
        const totalDuration = newPhases.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const totalBudget = newPhases.reduce((acc, curr) => acc + (curr.budget || 0), 0);

        // 2. Determine New Status based on Phase logic
        let newStatus = project.status;

        if (newPhases.length > 0) {
            if (newPhases.some(p => p.status === PhaseStatus.active)) {
                newStatus = ProjectStatus.active;
            }
            else if (newPhases.every(p => p.status === PhaseStatus.completed)) {
                newStatus = ProjectStatus.completed;
            }
        }

        // 3. Check for any significant changes to avoid unnecessary re-renders/loops
        const hasTotalsChanged =
            project.totalDuration !== totalDuration ||
            project.totalBudget !== totalBudget;

        const hasStatusChanged = project.status !== newStatus;

        if (hasTotalsChanged || hasStatusChanged) {
            updateProjectRef.current({
                ...project,
                totalDuration,
                totalBudget,
                status: newStatus // Sync the derived status
            });
        }
    }, [projectId]);// Only depends on the ID, not the whole project object



    // ✅ CRITICAL: The Manager must be memoized ONLY on the Project ID.
    // If you put the whole 'project' object here, it will refresh every time you type.
    const Manager = useMemo(() => createEntityManager<Phase, GetPhaseOptions | undefined>({
        title: "Project Phases",
        itemName: "Phase",
        api: PhaseApi,
        onItemsChange: handleItemsChange,
        columns: [
            {
                header: "Title",
                field: "title",
                sortable: true,
                body: (r: Phase) => <span className="font-semibold">{r.title}</span>
            },
            {
                header: "Duration",
                field: "duration",
                sortable: true,
                body: (r: Phase) => `${r.duration} days`
            },
            {
                header: "Budget",
                field: "budget",
                sortable: true,
                body: (r: Phase) => (
                    <span className="font-mono text-green-700">
                        {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'ETB',
                            maximumFractionDigits: 0
                        }).format(r.budget)}
                    </span>
                )
            },
            {
                header: "Description",
                field: "description",
                body: (r: Phase) => (
                    <div className="truncate text-sm text-500" style={{ maxWidth: '250px' }} title={r.description}>
                        {r.description || "No description provided"}
                    </div>
                )
            },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (p: Phase) => <MyBadge type="status" value={p.status ?? "Proposed"} />
            }
        ],
        createNew: canManagePhases ? () => ({
            project: project,
            title: '',
            order: 1,
            duration: 0,
            budget: 0,
            description: "",
        }) : undefined,
        SaveDialog: canManagePhases ? SavePhase : undefined,
        permissionPrefix: "phase",
        query: () => ({
            project: projectId,
        }),
        workflow: {
            statusField: "status",
            transitions: PHASE_TRANSITIONS,
            statusOrder: PHASE_STATUS_ORDER
        },
        hideDefaultActions: !canManagePhases,
        hideSearch: true
    }), [projectId, canManagePhases]); // 👈 DO NOT add 'project' or 'handleItemsChange' here

    return <Manager />;
};

export default PhaseManager;