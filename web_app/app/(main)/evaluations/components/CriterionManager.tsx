'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { Criterion, FormType } from "../models/criterion.model";
import { CriterionApi } from "../api/criterion.api";
import SaveCriterion from "./SaveCriterion";
import { Evaluation } from "../../evaluations/models/evaluation.model";
import { useAuth } from "@/contexts/auth-context";
import OptionManager from "./OptionManager";


interface CriterionManagerProps {
    evaluation: Evaluation;
}

const CriterionManager = ({ evaluation }: CriterionManagerProps) => {

    const emptyCriterion: Criterion = {
        title: "",
        weight: 0,
        form_type: FormType.closed,
        evaluation
    };

    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();

    const canCreate = true; //hasPermission([PERMISSIONS.CRITERION.CREATE]);
    const canEdit = true; //hasPermission([PERMISSIONS.CRITERION.UPDATE]);
    const canDelete = true; //hasPermission([PERMISSIONS.CRITERION.DELETE]);

    /** CRUD Hook */
    const {
        items: criteria,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError,
    } = useCrudList<Criterion>();

    const [criterion, setCriterion] = useState<Criterion>(emptyCriterion);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch criteria for the evaluation */
    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                setLoading(true);
                const data = await CriterionApi.getCriteria({
                    evaluation
                });
                setAll(data);
            } catch (err: any) {
                setError("Failed to load criteria: " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchCriteria();
    }, [evaluation]);

    /** Save callback */
    const onSaveComplete = (saved: Criterion) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete criterion */
    const deleteCriterion = async (row: Criterion) => {
        const ok = await CriterionApi.deleteCriterion(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Table columns */
    const columns = [
        { header: "Title", field: "title" },
        { header: "Weight", field: "weight" },
        {
            header: "Form Type",
            field: "form_type",
            body: (row: Criterion) => row.form_type
        },
    ];

    return (
        <>
            <CrudManager
                headerTitle={`Manage Criteria for "${evaluation.title}"`}
                itemName="Criterion"
                items={criteria}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}

                enableSearch
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setCriterion({ ...emptyCriterion });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setCriterion({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: row.title,
                        onConfirmAsync: () => deleteCriterion(row),
                    })
                }

                rowExpansionTemplate={(row) => <OptionManager criterion={row} />}
            />

            {/* Save Dialog */}
            {criterion && (
                <SaveCriterion
                    visible={showSaveDialog}
                    criterion={criterion}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default CriterionManager;
