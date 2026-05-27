'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Phase, GetPhaseOptions, PhaseStatus } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";
import MyBadge from "@/templates/MyBadge";
import { Project, ProjectStatus } from "../../models/project.model";
import { PHASE_TRANSITIONS, PHASE_STATUS_ORDER } from "../models/phase.state-machine";
import SavePhase from "./SavePhase";
import { useMemo, useRef, useCallback } from "react";

interface PhaseManagerProps {
    project?: Project;
    updateProject?: (project: Project) => void;
}

const PhaseManager = ({ project, updateProject }: PhaseManagerProps) => {

    const canManagePhases = useMemo(() => project && (
        project.status === ProjectStatus.draft ||
        project.status === ProjectStatus.accepted
    ), [project?.status]);

    const projectId = project?._id;

    // 💡 FIX 1: Keep a mutable reference to the full project object. 
    // This gives us access to current project fields without breaking useCallback/useMemo.
    const projectRef = useRef(project);
    projectRef.current = project;

    const updateProjectRef = useRef(updateProject);
    updateProjectRef.current = updateProject;

    // 💡 FIX 2: Safely compute state transformations using the mutable ref
    const handleItemsChange = useCallback((newPhases: Phase[]) => {
        const currentProject = projectRef.current;
        if (!currentProject || !updateProjectRef.current) return;

        // 1. Calculate Totals
        const totalDuration = newPhases.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const totalBudget = newPhases.reduce((acc, curr) => acc + (curr.budget || 0), 0);

        // 2. Determine New Status based on Phase logic
        let newStatus = currentProject.status;

        if (newPhases.length > 0) {
            if (newPhases.some(p => p.status === PhaseStatus.terminated)) {
                newStatus = ProjectStatus.terminated;
            }
            else if (newPhases.some(p => p.status === PhaseStatus.active)) {
                newStatus = ProjectStatus.active;
            }
            else if (newPhases.every(p => p.status === PhaseStatus.completed)) {
                newStatus = ProjectStatus.completed;
            }
        }

        // 3. Compare against the absolute latest values to prevent update loops
        const hasTotalsChanged =
            currentProject.totalDuration !== totalDuration ||
            currentProject.totalBudget !== totalBudget;

        const hasStatusChanged = currentProject.status !== newStatus;

        if (hasTotalsChanged || hasStatusChanged) {
            updateProjectRef.current({
                ...currentProject, // Uses the fresh instance! No dropped state.
                totalDuration,
                totalBudget,
                status: newStatus
            });
        }
    }, [projectId]);



    // ✅ CRITICAL MEMOIZATION LOOP: Unchanged & protected from typing refreshes.
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
            project: projectRef.current, // Safely use reference
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
        disableEditRow: (row) => row.status !== PhaseStatus.proposed,
        disableDeleteRow: (row) => row.status !== PhaseStatus.proposed,
        hideSearch: true
    }), [projectId, canManagePhases]);

    return <Manager />;
};

export default PhaseManager;