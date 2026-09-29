'use client';

import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";

import { Project } from "../../models/project.model";
import { PhaseApi } from "../api/phase.api";
import SavePhase from "../components/SavePhase";
import { FilterPhaseOptions, Phase } from "../models/phase.model";
import { PHASE_TRANSITIONS } from "../models/phase.state-machine";
import { etbCurrencyFormatter } from "@/utils/utils";
import PhaseDetail from "../components/PhaseDetail";

interface PhaseManagerProps {
    project: Project;
    updateProject?: (project: Project) => void;
    enableEditing?: boolean;
}

const PhaseManager = ({
    project,
    enableEditing
}: PhaseManagerProps) => {
    const Manager = createEntityManager<Phase, FilterPhaseOptions>({
        itemName: "Phase",
        api: PhaseApi,
        useLookup: true,

        query: () => ({ project }),
        columns: [
            {
                header: "Title",
                field: "title",
                sortable: true,
                body: (r: Phase) => (
                    <span className="font-semibold">
                        {r.title}
                    </span>
                )
            },
            {
                header: "Duration",
                field: "duration",
                sortable: true,
                body: (r: Phase) => (
                    `${r.duration} days`
                )
            },
            {
                header: "Budget",
                field: "budget",
                sortable: true,
                body: (phase: Phase) => (
                    <span className="font-mono text-green-700">
                        {etbCurrencyFormatter.format(phase.budget)}
                    </span>
                )
            },
            /*
            {
                header: "Description",
                field: "description",
                body: (r: Phase) => (
                    <div
                        className="truncate text-sm text-500"
                        style={{ maxWidth: "250px" }}
                        title={r.description}
                    >
                        {r.description || "No description provided"}
                    </div>
                )
            },
            */
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (p: Phase) => (
                    <MyBadge
                        type="status"
                        value={p.status ?? "Proposed"}
                    />
                )
            }
        ],

        permissionPrefix: "phase",

        createNew: () => ({
            project,
            title: "",
            order: 1,
            duration: 0,
            budget: 0,
            description: ""
        }),

        SaveDialog: SavePhase,

        workflow: {
            statusField: "status",
            transitions: PHASE_TRANSITIONS
        },

        expandable: {
            template: (project) => (
                <PhaseDetail phase={project} />
            )
        },

        hideSearch: true,
        hideDefaultActions: !enableEditing
    });
    return <Manager key={project?._id} />;
};

export default PhaseManager;