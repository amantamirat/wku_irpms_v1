'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { Evaluation } from "../models/evaluation.model";
import { EvaluationApi } from "../api/evaluation.api";
import SaveEvaluation from "./SaveEvaluation";
import CriterionManager from "./CriterionManager";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { DirectorateSelector } from "@/components/DirectorateSelector";
import { useDirectorate } from "@/contexts/DirectorateContext";

const EvaluationManager = () => {

    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();

    const canCreate = hasPermission([PERMISSIONS.EVALUATION.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.EVALUATION.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.EVALUATION.DELETE]);

    const { directorate, directorates } = useDirectorate();

    const emptyEvaluation: Evaluation = {
        directorate: directorate ?? "",
        title: ""
    };

    /** CRUD Hook */
    const {
        items: evaluations,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError,
    } = useCrudList<Evaluation>();

    const [evaluation, setEvaluation] = useState<Evaluation>(emptyEvaluation);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch evaluations */
    useEffect(() => {
        if (!directorate) {
            return
        }
        const fetchEvaluations = async () => {
            try {
                setLoading(true);
                const data = await EvaluationApi.getEvaluations({});
                setAll(data);
            } catch (err: any) {
                setError("Failed to load evaluations. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchEvaluations();
    }, [directorate]);

    /** Save callback */
    const onSaveComplete = (saved: Evaluation) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete evaluation */
    const deleteEvaluation = async (row: Evaluation) => {
        const ok = await EvaluationApi.deleteEvaluation(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Table columns */
    const columns = [
        //{ header: "Directorate", field: "directorate.name" },
        { header: "Title", field: "title" },
        { header: "Description", field: "description" },
    ];

    const topTemplate = () => {
        return (<DirectorateSelector />)
    };

    return (
        <>
            <CrudManager
                headerTitle="Manage Evaluations"
                itemName="Evaluation"
                items={evaluations}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}

                /** Permissions */
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                /** Handlers */
                onCreate={() => {
                    setEvaluation({ ...emptyEvaluation });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setEvaluation({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: row.title,
                        onConfirmAsync: () => deleteEvaluation(row),
                    })
                }

                topTemplate={topTemplate()}
                enableSearch
                /** Expand row → show criteria manager */
                rowExpansionTemplate={(row) => (
                    <CriterionManager evaluation={row as Evaluation} />
                )}
            />

            {/* Save Dialog */}
            <SaveEvaluation
                visible={showSaveDialog}
                evaluation={evaluation}
                directorates={directorates}
                onComplete={onSaveComplete}
                onHide={hideDialogs}
            />
        </>
    );
};

export default EvaluationManager;
