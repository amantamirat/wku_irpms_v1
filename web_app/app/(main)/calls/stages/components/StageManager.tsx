'use client';

import ProjectDocManager from "@/app/(main)/projects/documents/components/ProjectDocManager";
import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useState } from "react";
import { Call } from "../../models/call.model";
import { StageApi } from "../api/stage.api";
import { Stage, StageStatus } from "../models/stage.model";
import SaveStage from "./SaveStage";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { Button } from "primereact/button";

interface StageManagerProps {
    call?: Call;
}

const StageManager = ({ call }: StageManagerProps) => {

    const emptyStage: Stage = {
        call: call ?? "",
        name: "",
        evaluation: "",
        status: StageStatus.planned
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.STAGE.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.STAGE.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.STAGE.DELETE]);
    const canChangeStatus = hasPermission([PERMISSIONS.STAGE.CHANGE_STATUS]);

    const canPlan = hasPermission([PERMISSIONS.STAGE.STATUS.PLANNED]);
    const canActivate = hasPermission([PERMISSIONS.STAGE.STATUS.ACTIVATE]);
    const canClose = hasPermission([PERMISSIONS.STAGE.STATUS.CLOSE]);

    // CRUD Hook
    const {
        items: stages,
        updateItem,
        removeItem,
        setAll,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Stage>();

    const [selectedStage, setSelectedStage] = useState<Stage>(emptyStage);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Fetch stages for this cycle
    useEffect(() => {
        const fetchStages = async () => {
            try {
                setLoading(true);
                const data = await StageApi.getStages({ call });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch stages. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchStages();
    }, [call]);


    // Save (create/update)
    const onSaveComplete = (savedStage: Stage) => {
        updateItem(savedStage);
        hideSaveDialog();
    };

    const updateStatus = async (row: Stage, next: StageStatus) => {
        if (!row._id) {
            return;
        }
        const updated = await StageApi.updateStatus(row._id, next);
        onSaveComplete({
            ...updated,
            call: row.call,
            evaluation: row.evaluation
        });
    };

    const stateTransitionTemplate = (row: Stage) => {
        const current = row.status;
        let prev = undefined;
        let next = undefined;
        if (current === StageStatus.planned) {
            if (canActivate) {
                next = StageStatus.active;
            }
        }
        else if (current === StageStatus.active) {
            if (canClose) {
                next = StageStatus.closed;
            }
            if (canPlan) {
                prev = StageStatus.planned;
            }
        }
        else if (current === StageStatus.closed) {
            if (canActivate) {
                prev = StageStatus.active;
            }
        }

        return (<div className="flex gap-2">
            {(next)
                &&
                <Button
                    tooltip={`Make ${next}`}
                    icon={next === StageStatus.closed ? "pi pi-lock" : "pi pi-check"}
                    severity={next === StageStatus.closed ? "danger" : "success"}
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: `Make to ${next}`,
                            onConfirmAsync: () => updateStatus(row, next)
                        });
                    }}
                />
            }
            {(prev)
                &&
                <Button
                    tooltip={`Back to ${prev}`}
                    icon="pi pi-undo"
                    severity="warning"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: `back to ${prev}`,
                            onConfirmAsync: () => updateStatus(row, prev)
                        });
                    }}
                />
            }
        </div>);
    }

    // Delete
    const deleteStage = async (row: Stage) => {
        const deleted = await StageApi.delete(row);
        if (deleted) {
            removeItem(row);
        }
    };

    const hideSaveDialog = () => {
        setSelectedStage(emptyStage);
        setShowSaveDialog(false);
    };

    // Table columns
    const columns = [
        !call && { header: "Call", field: "call.title" },
        { header: "Name", field: "name", sortable: true },
        { header: "Evaluation", field: "evaluation.title", sortable: true },
        {
            header: "Deadline",
            body: (row: Stage) =>
                row.deadline ? new Date(row.deadline).toLocaleDateString() : ""
        },

        {
            header: "Status",
            body: (row: Stage) => <MyBadge type="status" value={row.status ?? "Unknown"} />,
            sortable: true
        },
        canChangeStatus && { body: stateTransitionTemplate }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Manage Stages"
                items={stages}
                dataKey="_id"
                columns={columns}

                loading={loading}
                error={error}

                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setSelectedStage({ ...emptyStage });
                    setShowSaveDialog(true);
                }}
                onEdit={(row: Stage) => {
                    setSelectedStage({ ...row });
                    setShowSaveDialog(true);
                }
                }
                onDelete={(row: Stage) =>
                    confirm.ask({
                        item: row.name ?? "",
                        onConfirmAsync: () => deleteStage(row)
                    })
                }

                rowExpansionTemplate={(row: Stage) => {
                    return (
                        <ProjectDocManager stage={row} />
                    )
                }
                }
            //enableSearch
            />

            {/* Create / Edit Stage */}
            <SaveStage
                visible={showSaveDialog}
                stage={selectedStage}
                callProvided={!!call}
                onComplete={onSaveComplete}
                onHide={hideSaveDialog}
            />
        </>
    );
};

export default StageManager;
