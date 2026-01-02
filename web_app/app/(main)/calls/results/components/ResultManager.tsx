'use client';

import { Stage } from "@/app/(main)/calls/stages/models/stage.model";
import { CriterionApi } from "@/app/(main)/evaluations/api/criterion.api";
import { Criterion, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useMemo, useState } from "react";
import { ProjectDoc } from "../../documents/models/document.model";
import { Reviewer, ReviewerStatus } from "../../reviewers/models/reviewer.model";
import { Button } from "primereact/button";
import { ResultApi } from "../api/result.api";
import { Result } from "../models/result.model";
import { PERMISSIONS } from "@/types/permissions";
import SaveResultDialog from "./SaveResultDialog";

interface ResultManagerProps {
    reviewer: Reviewer;
    updateStatus?: (reviewer: Reviewer, nextStatus: ReviewerStatus) => Promise<void>;
}

const ResultManager = ({ reviewer, updateStatus }: ResultManagerProps) => {

    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();

    const [criteria, setCriteria] = useState<Criterion[]>([]);
    const [results, setResults] = useState<Result[]>([]);
    const [selected, setSelected] = useState<Result | undefined>(undefined);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const {
        loading,
        setLoading,
        error,
        setError,
    } = useCrudList<Result>();

    const canCreate = hasPermission([PERMISSIONS.RESULT.CREATE]);

    /* ------------------------------------------------
       Fetch criteria & results
    ------------------------------------------------- */
    useEffect(() => {
        if (!reviewer) return;

        const projectDoc = reviewer.projectStage as ProjectDoc;
        const stage = projectDoc?.stage as Stage;
        const evaluation = stage?.evaluation;

        if (!evaluation) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                const [criteriaData, resultsData] = await Promise.all([
                    CriterionApi.getCriteria({ evaluation }),
                    ResultApi.getResults({ reviewer })
                ]);

                setCriteria(criteriaData);
                setResults(resultsData);

            } catch (err: any) {
                setError("Failed to load data: " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [reviewer]);

    /* ------------------------------------------------
       DERIVED rows (NO STATE)
    ------------------------------------------------- */
    const items: Result[] = useMemo(() => {
        return criteria.map((criterion) => {
            const existing = results.find(
                r => (r.criterion as Criterion)?._id === criterion._id
            );

            return (
                existing ?? {
                    criterion,
                    score: 0,
                    reviewer,
                    selectedOption: ""
                }
            );
        });
    }, [criteria, results, reviewer]);

    /* ------------------------------------------------
       Helpers
    ------------------------------------------------- */
    const calculateTotalWeight = () =>
        items.reduce((sum, r) => {
            const c = r.criterion as Criterion;
            return sum + (c?.weight || 0);
        }, 0);

    const calculateTotalScore = () =>
        items.reduce((sum, r) => sum + (r.score ?? 0), 0);

    const scoreTemplate = (row: Result) => {
        const criterion = row.criterion as Criterion;
        if (!criterion) return "-";

        if (criterion.formType === FormType.closed) {
            const opt = row.selectedOption as any;
            return opt ? `${opt.title} (${opt.score})` : "-";
        }

        return row.score ?? "-";
    };

    /* ------------------------------------------------
       Dialog handlers
    ------------------------------------------------- */
    const hideSaveDialog = () => {
        setSelected(undefined);
        setShowSaveDialog(false);
    };

    const onSaveComplete = (saved: Result) => {
        setResults(prev => {
            const index = prev.findIndex(
                r =>
                    (r.criterion as Criterion)?._id ===
                    (saved.criterion as Criterion)?._id
            );

            if (index !== -1) {
                const updated = [...prev];
                updated[index] = saved;
                return updated;
            }

            return [...prev, saved];
        });

        //hideSaveDialog();
    };

    const deleteResult = async (row: Result) => {
        const deleted = await ResultApi.deleteResult(row);
        if (!deleted) return;

        setResults(prev =>
            prev.map(r =>
                (r.criterion as Criterion)?._id ===
                    (row.criterion as Criterion)?._id
                    ? { ...r, _id: undefined, score: 0, selectedOption: undefined }
                    : r
            )
        );
    };

    /* ------------------------------------------------
       Toolbar
    ------------------------------------------------- */
    const endToolbarTemplate = () => {
        const state = reviewer.status;

        return (
            <div className="my-2">
                {state === ReviewerStatus.verified && (
                    <Button label="Submit" icon="pi pi-check" outlined severity="success"
                        onClick={() => {
                            if (!reviewer || !updateStatus) return;
                            confirm.ask({
                                operation: 'submit',
                                onConfirmAsync: () => updateStatus(reviewer, ReviewerStatus.submitted)
                            });
                        }}
                    />
                )}

                {state === ReviewerStatus.submitted && (
                    <Button label="Revert" icon="pi pi-arrow-left" outlined severity="warning"
                        onClick={() => {
                            if (!reviewer || !updateStatus) return;
                            confirm.ask({
                                operation: 'Recall Submission',
                                onConfirmAsync: () => updateStatus(reviewer, ReviewerStatus.verified)
                            });
                        }}
                    />
                )}
            </div>
        );
    };

    /* ------------------------------------------------
       Table columns
    ------------------------------------------------- */
    const columns = [
        { header: "Title", field: "criterion.title" },
        {
            header: "Weight",
            field: "criterion.weight",
            footer: <strong>Weight: {calculateTotalWeight()}</strong>
        },
        {
            header: "Score",
            field: "score",
            body: (row: Result) => scoreTemplate(row),
            footer: <strong>Score: {calculateTotalScore()}</strong>
        },
        { header: "Comment", field: "comment" }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Manage Results"
                itemName="Results"
                items={items}
                dataKey="criterion._id"
                columns={columns}
                loading={loading}
                error={error}
                toolbarEnd={endToolbarTemplate()}
                extraActions={(row) => (
                    <>
                        {canCreate && (
                            <Button
                                icon="pi pi-pencil"
                                rounded
                                severity="success"
                                className="p-button-rounded p-button-text"
                                onClick={() => {
                                    setSelected(
                                        row._id
                                            ? row
                                            : { criterion: row.criterion, reviewer }
                                    );
                                    setShowSaveDialog(true);
                                }}
                            />
                        )}

                        {row._id && (
                            <Button
                                icon="pi pi-times"
                                rounded
                                severity="warning"
                                className="p-button-rounded p-button-text"
                                onClick={() =>
                                    confirm.ask({
                                        item: `result of ${(row.criterion as Criterion).title}`,
                                        onConfirmAsync: () => deleteResult(row)
                                    })
                                }
                            />
                        )}
                    </>
                )}
            />

            {showSaveDialog && (
                <SaveResultDialog
                    visible={showSaveDialog}
                    result={selected}
                    onCompelete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            )}
        </>
    );
};

export default ResultManager;
