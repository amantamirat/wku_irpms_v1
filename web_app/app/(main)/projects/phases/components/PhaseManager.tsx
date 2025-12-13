'use client';

import { useEffect, useState } from "react";
import { CrudManager } from "@/components/CrudManager";
import ErrorCard from "@/components/ErrorCard";
import ListSkeleton from "@/components/ListSkeleton";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";

import SavePhaseDialog from "./SavePhaseDialog";

import { Project } from "../../models/project.model";
import { Phase, PhaseType } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";

import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";

interface PhaseManagerProps {
    project: Project;
    phaseType: PhaseType;
    setProject?: (project: Project) => void;
}

export default function PhaseManager({ project, phaseType, setProject }: PhaseManagerProps) {
    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();

    // -------------------------------
    // Empty Phase
    // -------------------------------
    const emptyPhase: Phase = {
        project: project,
        type: phaseType,
        activity: "",
        duration: 0,
        budget: 0,
        description: "",
    };

    // -------------------------------
    // Permissions
    // -------------------------------

    const canCreate = !!project && hasPermission([PERMISSIONS.PHASE.CREATE]);
    const canEdit = !!project && hasPermission([PERMISSIONS.PHASE.UPDATE]);
    const canDelete = !!project && hasPermission([PERMISSIONS.PHASE.DELETE]);

    // -------------------------------
    // CRUD Hook
    // -------------------------------
    const {
        items: phases,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError,
    } = useCrudList<Phase>();

    const [phase, setPhase] = useState<Phase>(emptyPhase);
    const [showDialog, setShowDialog] = useState(false);

    // -------------------------------
    // Fetch phases
    // -------------------------------
    useEffect(() => {
        const fetchPhases = async () => {
            try {
                setLoading(true);
                // If project exists on DB, fetch from API
                if (project._id) {
                    const data = await PhaseApi.getPhases({ project });
                    setAll(data);
                } else {
                    // Use local phases
                    setAll(project.phases ?? []);
                }
            } catch (err: any) {
                setError("Failed to fetch phases. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchPhases();
    }, [project]);

    // -------------------------------
    // Save / Create
    // -------------------------------
    const onSaveComplete = (saved: Phase) => {
        updateItem(saved);
        hideDialog();
    };

    const addLocalPhase = (saved: Phase) => {
        const exists = phases.some(p => p.order === saved.order);
        if (exists) throw new Error("The order is already added!");

        const updated = [...(project.phases ?? []), saved];
        setProject?.({ ...project, phases: updated });

        hideDialog();
    };

    // -------------------------------
    // Delete
    // -------------------------------
    const deletePhase = async (row: Phase) => {
        if (project._id) {
            const deleted = await PhaseApi.deletePhase(row);
            if (deleted) removeItem(row);
        } else {
            const updated = project.phases?.filter(p => p.activity !== row.activity) ?? [];
            setProject?.({ ...project, phases: updated });
            removeItem(row);
        }
    };

    // -------------------------------
    // Helpers
    // -------------------------------
    const hideDialog = () => {
        setPhase(emptyPhase);
        setShowDialog(false);
    };

    const handleCreate = () => {
        const maxLevel = Math.max(0, ...phases.map(p => p.order ?? 0));
        const newPhase = { ...emptyPhase, order: maxLevel + 1 };
        setPhase(newPhase);
        setShowDialog(true);
    };

    const handleEdit = (row: Phase) => {
        setPhase(row);
        setShowDialog(true);
    };

    const columns = [
        { field: "activity", header: "Activity", sortable: true },
        { field: "duration", header: "Duration (Days)", sortable: true },
        { field: "budget", header: "Budget (ETB)", sortable: true },
        { field: "description", header: "Description" },
    ];

    return (
        <>
            <CrudManager
                headerTitle={`${phaseType} Phases`}
                items={phases}
                dataKey={phases.some(p => p._id) ? "_id" : "order"}
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={handleCreate}
                onEdit={handleEdit}
                onDelete={(row) =>
                    confirm.ask({
                        item: row.activity,
                        onConfirmAsync: () => deletePhase(row),
                    })
                }
            />

            <SavePhaseDialog
                visible={showDialog}
                phase={phase}
                onSave={!project._id ? addLocalPhase : undefined}
                onComplete={onSaveComplete}
                onHide={hideDialog}
            />
        </>
    );
}
