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
import PhaseDocManager from "../documents/components/PhaseDocManager";


interface PhaseManagerProps {
    project?: Project;
    phaseType: PhaseType;
    flyMode?: boolean;
    onSave?: (phase: Phase) => void;
    onRemove?: (pahse: Phase) => void;
}

export default function PhaseManager({ project, phaseType, flyMode = false, onSave, onRemove }: PhaseManagerProps) {

    const confirm = useConfirmDialog();
    const { getApplicant, hasPermission } = useAuth();
    //const linkedApplicant = getLinkedApplicant();
    //const loggedApplicantId = linkedApplicant?._id ?? linkedApplicant;
    //const isLeadPI = loggedApplicantId === (project.leadPI as any)._id;

    const emptyPhase: Phase = {
        project: project,
        type: phaseType,
        activity: "",
        duration: 0,
        budget: 0,
        description: "",
        status: PhaseStatus.proposed
    };

    // -------------------------------
    // Permissions
    // -------------------------------
    const isValidStatus = project ? (project.status === ProjectStatus.pending ||
        project.status === ProjectStatus.negotiation) : false;

    const canCreate = isValidStatus && hasPermission([PERMISSIONS.PHASE.CREATE]);
    const canEdit = isValidStatus && hasPermission([PERMISSIONS.PHASE.UPDATE]);
    const canDelete = isValidStatus && hasPermission([PERMISSIONS.PHASE.DELETE]);
    // State permissions
    const canPropose = hasPermission([PERMISSIONS.PHASE.STATUS.PROPOSE]);
    const canReview = hasPermission([PERMISSIONS.PHASE.STATUS.REVIEW]);
    const canApprove = hasPermission([PERMISSIONS.PHASE.STATUS.APPROVE]);
    const canActivate = hasPermission([PERMISSIONS.PHASE.STATUS.ACTIVATE]);
    const canComplete = hasPermission([PERMISSIONS.PHASE.STATUS.COMPLETE]);

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
                const data = await PhaseApi.getPhases({ project });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch phases. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        if (flyMode && project) {
            setAll(project?.phases ?? []);
        } else {
            fetchPhases();
        }
    }, [project]);

    // -------------------------------
    // Save / Create
    // -------------------------------
    const onSaveComplete = (saved: Phase) => {
        updateItem(saved);
        hideDialog();
    };

    // -------------------------------
    // Delete
    // -------------------------------
    const deletePhase = async (row: Phase) => {
        const deleted = await PhaseApi.delete(row);
        if (deleted) removeItem(row);
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

    const stateTransitionTemplate = (row: Phase) => {
        const current = row.status;
        let prev: PhaseStatus | undefined;
        let next: PhaseStatus | undefined;

        if (current === PhaseStatus.proposed) {
            if (canReview && project?.status === ProjectStatus.negotiation) {
                next = PhaseStatus.reviewed;
            }
        }
        else if (current === PhaseStatus.reviewed) {
            if (canApprove) {
                next = PhaseStatus.approved;
            }
            if (canPropose) {
                prev = PhaseStatus.proposed;
            }
        }
        else if (current === PhaseStatus.approved) {
            if (canActivate) {
                next = PhaseStatus.active;
            }
            if (canReview && project?.status === ProjectStatus.negotiation) {
                prev = PhaseStatus.reviewed;
            }
        }
        else if (current === PhaseStatus.active) {
            if (canComplete) {
                next = PhaseStatus.completed;
            }
            if (canApprove) {
                prev = PhaseStatus.approved;
            }
        }
        else if (current === PhaseStatus.completed) {
            if (canActivate) {
                prev = PhaseStatus.active;
            }
        }

        return (
            <div className="flex gap-2">
                {(next) &&
                    <Button
                        tooltip={`Make ${next}`}
                        icon="pi pi-check"
                        severity="success"
                        size="small"
                        onClick={() => {
                            confirm.ask({
                                operation: `Make to ${next}`,
                                onConfirmAsync: () => updateStatus(row, next)
                            });
                        }}
                    />
                }

                {(prev) &&
                    <Button
                        tooltip={`Back to ${prev}`}
                        icon="pi pi-undo"
                        severity="warning"
                        size="small"
                        onClick={() => {
                            confirm.ask({
                                operation: `Back to ${prev}`,
                                onConfirmAsync: () => updateStatus(row, prev)
                            });
                        }}
                    />
                }
            </div>
        );
    };

    const calculateTotalBudget = () =>
        phases.reduce((sum, p) => sum + (p.budget ?? 0), 0);

    const calculateTotalDuration = () =>
        phases.reduce((sum, p) => sum + (p.duration ?? 0), 0);

    const columns = [
        { field: "activity", header: "Activity", sortable: true },
        {
            field: "duration", header: "Duration (Days)", sortable: true,
            footer: <strong>Total Durations: {calculateTotalDuration()}</strong>
        },
        {
            field: "budget", header: "Budget (ETB)", sortable: true,
            footer: <strong>Total Budget: {calculateTotalBudget().toLocaleString()}</strong>
        },
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
                dataKey={flyMode ? "order" : "_id"}
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
                        onConfirm: flyMode && onRemove ? () => onRemove(row) : undefined,
                        onConfirmAsync: !flyMode ? () => deletePhase(row) : undefined,
                    })
                }
                rowExpansionTemplate={project?.status === ProjectStatus.granted ? (row) => {
                    return <PhaseDocManager phase={row._id || ''} />;
                } : undefined}
            />
            <SavePhaseDialog
                visible={showDialog}
                phase={phase}
                onSave={flyMode && onSave ? onSave : undefined}
                onComplete={onSaveComplete}
                onHide={hideDialog}
            />
        </>
    );
}
