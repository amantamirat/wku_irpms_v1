'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

import SavePhaseDialog from "./SavePhaseDialog";

import { Project, ProjectStatus } from "../../models/project.model";
import { PhaseApi } from "../api/phase.api";
import { Phase, PhaseStatus, PhaseType } from "../models/phase.model";

import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import MyBadge from "@/templates/MyBadge";
import { Button } from "primereact/button";

interface PhaseManagerProps {
    project: Project;
    phaseType: PhaseType;
    setProject?: (project: Project) => void;
}

export default function PhaseManager({ project, phaseType, setProject }: PhaseManagerProps) {

    const confirm = useConfirmDialog();
    const { getApplicant: getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;
    const isLeadPI = loggedApplicantId === (project.leadPI as any)._id;

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
    const isValidStatus = project ? (project.status === ProjectStatus.pending ||
        project.status === ProjectStatus.negotiation) : false;

    const canCreate = isValidStatus && isLeadPI && hasPermission([PERMISSIONS.PHASE.CREATE]);
    const canEdit = isValidStatus && isLeadPI && hasPermission([PERMISSIONS.PHASE.UPDATE]);
    const canDelete = isValidStatus && isLeadPI && hasPermission([PERMISSIONS.PHASE.DELETE]);
    // State permissions
    const canVerify = (project.status === ProjectStatus.negotiation) && hasPermission([PERMISSIONS.PHASE.STATUS.VERIFY]);
    const canApprove = hasPermission([PERMISSIONS.PHASE.STATUS.APPROVE]);
    const canPropose = hasPermission([PERMISSIONS.PHASE.STATUS.PROPOSE]);
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
            const deleted = await PhaseApi.delete(row);
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

    const updateStatus = async (row: Phase, next: PhaseStatus) => {
        if (!row._id) {
            return;
        }
        const updated = await PhaseApi.updateStatus(row._id, next);
        onSaveComplete({
            ...updated,
            project: row.project
        });
    };

    const stateTransitionTemplate = (rowData: Phase) => {
        const state = rowData.status;
        return (<div className="flex gap-2">
            {(canVerify &&
                ((state === PhaseStatus.proposed && isLeadPI) || state === PhaseStatus.approved))
                &&
                <Button
                    tooltip="Verify"
                    icon="pi pi-verified"
                    severity="info"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'Verify',
                            onConfirmAsync: () => updateStatus(rowData, PhaseStatus.verified)
                        });
                    }}
                />
            }
            {(canApprove &&
                state === PhaseStatus.verified)
                &&
                <Button
                    tooltip="Approve"
                    icon="pi pi-check-circle"
                    severity="success"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'Approve',
                            onConfirmAsync: () => updateStatus(rowData, PhaseStatus.approved)
                        });
                    }}
                />
            }
            {(canPropose &&
                state === PhaseStatus.verified)
                &&
                <Button
                    tooltip="Back to proposed"
                    icon="pi pi-undo"
                    severity="warning"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'back to proposed',
                            onConfirmAsync: () => updateStatus(rowData, PhaseStatus.proposed)
                        });
                    }}
                />
            }
        </div>);
    }





    const columns = [
        { field: "activity", header: "Activity", sortable: true },
        { field: "duration", header: "Duration (Days)", sortable: true },
        { field: "budget", header: "Budget (ETB)", sortable: true },
        { field: "description", header: "Description" },
        {
            field: "status", header: "Status", sortable: true,
            body: (p: Phase) =>
                <MyBadge type="status" value={p.status ?? 'Unknown'} />
        },
        { body: stateTransitionTemplate }
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
