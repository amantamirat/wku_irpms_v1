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
import { FileUpload } from "primereact/fileupload";


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
            body: (row: Criterion) =>
                <span className={`form-badge form-type-${row.form_type?.toLowerCase()}`}>
                    {row.form_type}
                </span>
        },
    ];

    /*
    const endToolbarTemplate = () => {
        const handleImport = async (event: any) => {
            try {
                const file = event.files[0];
                if (!file) return;

                const text = await file.text();
                const json = JSON.parse(text);
                let criteriaData;
                if (Array.isArray(json)) {
                    criteriaData = json;
                } else {
                    criteriaData = json.criteriaData;
                }

                if (!Array.isArray(criteriaData)) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Import Error',
                        detail: 'Invalid import data',
                        life: 3000
                    });
                    return;
                }
                // Call API
                if (evaluation?._id) {
                    const result = await CriterionApi.importCriteriaBatch(evaluation._id, criteriaData);
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Import Successful',
                        detail: `Imported ${result.length} criteria`,
                        life: 3000
                    });
                }
                // Reload themes
                await fetchCriteria();
            } catch (err) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Import Failed',
                    detail: '' + err,
                    life: 3000
                });
            }
        };
        return (
            <div className="my-2">
                <FileUpload
                    mode="basic"
                    accept="application/json"
                    maxFileSize={1000000}
                    chooseLabel="Import"
                    className="mr-2 inline-block"
                    customUpload
                    uploadHandler={handleImport}
                />
            </div>
        );
    };
*/
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
