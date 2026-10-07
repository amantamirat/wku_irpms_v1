'use client';

import { useMemo, useState } from "react";
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";

import { Project } from "../../models/project.model";
import { PhaseApi } from "../api/phase.api";
import SavePhase from "../components/SavePhase";
import { FilterPhaseOptions, Phase, PhaseStatus } from "../models/phase.model";
import { PHASE_TRANSITIONS } from "../models/phase.state-machine";
import { etbCurrencyFormatter } from "@/utils/utils";
import PhaseDetail from "../components/PhaseDetail";
import { DocumentTemplateApi } from "@/app/(main)/documentTemplates/api/documentTemplate.api";

interface PhaseManagerProps {
    project: Project;
    updateProject?: (project: Project) => void;
    enableEditing?: boolean;
}

const PhaseManager = ({
    project,
    enableEditing
}: PhaseManagerProps) => {
    // Track loading state per row ID or globally for generation actions
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const Manager = useMemo(
        () =>
            createEntityManager<Phase, FilterPhaseOptions>({
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
                        body: (r: Phase) => `${r.duration} days`
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
                    template: (phase) => (
                        <PhaseDetail phase={phase} />
                    )
                },

                extraRowActions: [
                    {
                        icon: "pi pi-file-pdf",
                        severity: "success",
                        tooltip: "Generate Agreement PDF",
                        disabled: (row: Phase) => row.status !== PhaseStatus.approved || generatingId === row._id,
                        onClick: async (row: Phase) => {
                            if (!row._id) return;

                            try {
                                setGeneratingId(row._id);

                                const response = await DocumentTemplateApi.generate(row._id);
                                const blob = new Blob([response], { type: 'application/pdf' });
                                const blobUrl = window.URL.createObjectURL(blob);
                                const newWindow = window.open(blobUrl, '_blank');

                                if (!newWindow) {
                                    console.error("Popup blocked! Please allow popups for this site.");
                                }
                            } catch (error) {
                                console.error("Failed to generate agreement PDF", error);
                            } finally {
                                setGeneratingId(null);
                            }
                        }
                    }
                ],

                hideSearch: true,
                hideDefaultActions: !enableEditing
            }),
        [
            project._id,
            enableEditing,
            generatingId
        ]
    );

    return <Manager />;
};

export default PhaseManager;