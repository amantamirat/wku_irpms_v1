'use client';

import { useEffect, useState } from "react";
import { CrudManager } from "@/components/CrudManager";
import ErrorCard from "@/components/ErrorCard";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import ListSkeleton from "@/components/ListSkeleton";
import SaveStage from "./SaveStage";
import MyBadge from "@/templates/MyBadge";
import { useCrudList } from "@/hooks/useCrudList";
import { Stage, StageStatus, StageType } from "../models/stage.model";
import { StageApi } from "../api/stage.api";
import { Cycle } from "../../models/cycle.model";
import ProjectStageManager from "@/app/(main)/projects/stages/components/ProjectStageManager";

interface StageManagerProps {
    cycle: Cycle;
}

const StageManager = ({ cycle }: StageManagerProps) => {
    const confirm = useConfirmDialog();

    const emptyStage: Stage = {
        cycle: cycle,
        name: "",
        type: StageType.evaluation,
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
    const [expandedRows, setExpandedRows] = useState<any[]>([]);

    // Fetch stages for this cycle
    useEffect(() => {
        const fetchStages = async () => {
            try {
                setLoading(true);
                const data = await StageApi.getStages({ cycle: cycle._id });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch stages. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        if (cycle?._id) fetchStages();
    }, [cycle?._id]);

    if (loading) return <ListSkeleton rows={10} />;
    if (error) return <ErrorCard errorMessage={error} />;

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
            header: "Type",
            body: (row: Stage) => <MyBadge type="stage" value={row.type ?? "Unknown"} />,
            sortable: true
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
                onDelete={(row: Stage) =>
                    confirm.ask({
                        item: row.name ?? "",
                        onConfirmAsync: () => deleteStage(row)
                    })
                }
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data)}
                rowExpansionTemplate={(row: Stage) => (
                    <ProjectStageManager stage={row} />
                )}
                //enableSearch
            />

            {/* Create / Edit Stage */}
            <SaveStage
                visible={showSaveDialog}
                stage={selectedStage}
                cycle={cycle}
                onComplete={onSaveComplete}
                onHide={hideSaveDialog}
            />
        </>
    );
};

export default StageManager;
