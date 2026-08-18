'use client';

import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useMemo, useState } from "react";
import { Project, ProjectStatus } from "../../models/project.model";
import { PhaseApi } from "../api/phase.api";
import SavePhase from "../components/SavePhase";
import { Phase } from "../models/phase.model";
import { PHASE_STATUS_ORDER, PHASE_TRANSITIONS } from "../models/phase.state-machine";
import { ProjectApi } from "../../api/project.api";

interface PhaseManagerProps {
    project: Project;
    updateProject?: (project: Project) => void;
    enableEditing?: boolean;
}

const PhaseManager = ({ project, updateProject, enableEditing }: PhaseManagerProps) => {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const canManage = useMemo(() => (
        enableEditing &&
        (project.status === ProjectStatus.draft ||
            project.status === ProjectStatus.approved)
    ), [project.status, enableEditing]);

    useEffect(() => {
        const fetchPhases = async () => {
            if (!project) return;
            setLoading(true);
            try {
                const data = await PhaseApi.getAll({ project: project }, true);
                setPhases(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching phases", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPhases();
    }, [project]);

    // useMemo prevents component re-creation on every render cycle
    const Manager = useMemo(() => {
        return createEntityManager<Phase>({
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
                    body: (p: Phase) => <MyBadge type="status" value={p.status ?? "Proposed"} />
                }
            ],
            items: phases,
            permissionPrefix: "phase",
            createNew: canManage
                ? () => ({
                    title: '',
                    order: 1,
                    duration: 0,
                    budget: 0,
                    description: "",
                })
                : undefined,
            SaveDialog: canManage ? SavePhase : undefined,
            workflow: {
                statusField: "status",
                transitions: PHASE_TRANSITIONS,
                statusOrder: PHASE_STATUS_ORDER
            },
            // Handle phase transition completion
            onTransitComplete: async (updatedPhase: Phase) => {
                //console.log("Phase transition complete triggered:", updatedPhase)
                // Refetch updated project from API (due to backend sync) & update parent Project state
                if (updateProject && project) {
                    try {
                        const projectId = project._id;
                        if (projectId) {
                            const updatedProject = await ProjectApi.getById!(projectId, true);
                            if (updatedProject) {
                                updateProject(updatedProject);
                            }
                        }
                    } catch (error) {
                        console.error("Error updating project state after phase transition", error);
                    }
                }
            },
            hideSearch: true,
            hideDefaultActions: !canManage,
        });
    }, [phases, project, updateProject, canManage]);

    if (loading) {
        return <div className="p-4 text-center">Loading phases...</div>;
    }

    return <Manager />;
};

export default PhaseManager;