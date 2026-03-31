'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Phase, GetPhaseOptions } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";
import MyBadge from "@/templates/MyBadge";
import { Project } from "../../models/project.model";
import { PHASE_TRANSITIONS, PHASE_STATUS_ORDER } from "../models/phase.state-machine";
import SavePhase from "./SavePhase";


interface PhaseManagerProps {
    project?: Project;
}

const PhaseManager = ({ project }: PhaseManagerProps) => {
    const Manager = createEntityManager<Phase, GetPhaseOptions | undefined>({
        title: "Project Phases",
        itemName: "Phase",
        api: PhaseApi,

        columns: [
            {
                header: "#",
                field: "order",
                sortable: true,
                style: { width: '60px' },
                body: (r: Phase) => <strong>{r.order}</strong>
            },
            {
                header: "Description",
                field: "description",
                style: { width: '300px' },
                body: (r: Phase) => (
                    <div className="truncate" title={r.description}>
                        {r.description || "No description provided"}
                    </div>
                )
            },
            {
                header: "Duration (Days)",
                field: "duration",
                sortable: true,
                style: { width: '150px' },
                body: (r: Phase) => `${r.duration} days`
            },
            {
                header: "Budget",
                field: "budget",
                sortable: true,
                style: { width: '150px' },
                body: (r: Phase) => (
                    <span className="font-mono">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(r.budget)}
                    </span>
                )
            },
            {
                header: "Activities",
                field: "breakdown",
                body: (r: Phase) => (
                    <span className="text-sm text-gray-500">
                        {r.breakdown?.length || 0} activities
                    </span>
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

        createNew: () => ({
            project: (project?._id || project || "") as string | Project,
            order: 1,
            duration: 0,
            budget: 0,
            description: "",
            breakdown: [] // Initialize empty breakdown array
        }),

        SaveDialog: SavePhase,
        permissionPrefix: "phase",

        query: () => ({
            project: project?._id,
        }),

        workflow: {
            statusField: "status",
            transitions: PHASE_TRANSITIONS,
            statusOrder: PHASE_STATUS_ORDER
        }
    });

    return <Manager />;
};

export default PhaseManager;