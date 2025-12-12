'use client';

import ProjectStageManager from "@/app/(main)/projects/stages/components/ProjectStageManager";
import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { useEffect, useState } from "react";
import { Call } from "../../models/call.model";
import { StageApi } from "../api/stage.api";
import { Stage, StageStatus } from "../models/stage.model";
import SaveStage from "./SaveStage";

interface StageManagerProps {
    call: Call;
}

const StageManager = ({ call }: StageManagerProps) => {
    const confirm = useConfirmDialog();

    const emptyStage: Stage = {
        call: call,
        name: "",
        evaluation: "",
        status: StageStatus.planned
    };

    const canCreate = true;// hasPermission([PERMISSIONS.STAGE.CREATE]);
    const canEdit = true; //hasPermission([PERMISSIONS.STAGE.UPDATE]);
    const canDelete = true;//hasPermission([PERMISSIONS.STAGE.DELETE])

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

    // Delete
    const deleteStage = async (row: Stage) => {
        const deleted = await StageApi.deleteStage(row);
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
        { header: "Order", field: "order", sortable: true },
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
        }
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
                    <ProjectStageManager stage={row} />
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
