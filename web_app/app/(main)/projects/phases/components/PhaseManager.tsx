'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Phase, GetPhaseOptions } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";
import MyBadge from "@/templates/MyBadge";
import { Project, ProjectStatus } from "../../models/project.model";
import { PHASE_TRANSITIONS, PHASE_STATUS_ORDER } from "../models/phase.state-machine";
import SavePhase from "./SavePhase";

interface PhaseManagerProps {
    project?: Project;
}

const PhaseManager = ({ project }: PhaseManagerProps) => {
    
    // Logic: Only allow modifications during Draft or Finalization (Negotiation)
    const canEditPhases = project && (
        project.status === ProjectStatus.draft || 
        project.status === ProjectStatus.finalization
    );

    const Manager = createEntityManager<Phase, GetPhaseOptions | undefined>({
        title: "Project Phases",
        itemName: "Phase",
        api: PhaseApi,

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
                body: (p: Phase) =>
                    <MyBadge type="status" value={p.status ?? "Proposed"} />
            }
        ],

        // Only enable "Create" if the project status allows it
        createNew: canEditPhases
            ? () => ({
                project: project,
                title: '',
                order: 1,
                duration: 0,
                budget: 0,
                description: "",
            })
            : undefined,

        // Hide the Save Dialog (Edit/Create UI) if not in editable status
        SaveDialog: canEditPhases ? SavePhase : undefined,
        
        permissionPrefix: "phase",

        query: () => ({
            project: project?._id || project,
        }),

        workflow: {
            statusField: "status",
            transitions: PHASE_TRANSITIONS,
            statusOrder: PHASE_STATUS_ORDER
        },

        // Professional UI: Hide action buttons (Edit/Delete) when project is locked
        hideDefaultActions: !canEditPhases,
        hideSearch: !!project
    });

    return <Manager />;
};

export default PhaseManager;