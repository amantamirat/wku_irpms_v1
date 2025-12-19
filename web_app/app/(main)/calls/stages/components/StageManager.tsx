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
    call: Call;
}

const StageManager = ({ call }: StageManagerProps) => {

    const emptyStage: Stage = {
        call: call,
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
        const updated = await StageApi.update({ _id: row._id, status: next }, true);
        onSaveComplete({
            ...updated,
            evaluation: row.evaluation
        });
    };


    const stateTransitionTemplate = (rowData: Stage) => {
        const state = rowData.status;
        return (<div className="flex gap-2">
            {(state === StageStatus.planned || state === StageStatus.closed) &&
                <Button
                    label="Activate"
                    icon="pi pi-check"
                    severity="success"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'activate',
                            onConfirmAsync: () => updateStatus(rowData, StageStatus.active)
                        });
                    }}
                />}

            {(state === StageStatus.active) &&
                <>
                    <Button
                        label="Close"
                        icon="pi pi-lock"
                        severity="danger"
                        size="small"
                        onClick={() => {
                            confirm.ask({
                                operation: 'close',
                                onConfirmAsync: () => updateStatus(rowData, StageStatus.closed)
                            });
                        }}
                    />
                    <Button
                        label="Plan"
                        icon="pi pi-arrow-left"
                        severity="warning"
                        size="small"
                        onClick={() => {
                            confirm.ask({
                                operation: 'change to plan',
                                onConfirmAsync: () => updateStatus(rowData, StageStatus.planned)
                            });
                        }}
                    />
                </>

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
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => {
                    setSelectedStage(emptyStage);
                    setShowSaveDialog(true);
                }}
                onEdit={(row: Stage) => {
                    setSelectedStage(row);
                    setShowSaveDialog(true);
                }
                }
                onDelete={(row: Stage) =>
                    confirm.ask({
                        item: row.name ?? "",
                        onConfirmAsync: () => deleteStage(row)
                    })
                }
                loading={loading}
                error={error}
                rowExpansionTemplate={(row: Stage) => (
                    <ProjectDocManager stage={row} />
                )}
            //enableSearch
            />

            {/* Create / Edit Stage */}
            <SaveStage
                visible={showSaveDialog}
                stage={selectedStage}
                call={call}
                onComplete={onSaveComplete}
                onHide={hideSaveDialog}
            />
        </>
    );
};

export default StageManager;
