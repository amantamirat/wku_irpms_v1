'use client';
import { Criterion, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useMemo, useState } from "react";
import { Reviewer, ReviewerStatus } from "../../../reviewers/models/reviewer.model";
import { ResultApi } from "../api/result.api";
import { Result } from "../models/result.model";
import SaveResultDialog from "./SaveResultDialog";

interface ResultManagerProps {
    reviewer: Reviewer;
}

const ResultManager = ({ reviewer }: ResultManagerProps) => {

    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();
    const isAccepted = reviewer.status === ReviewerStatus.accepted;

    const canCreate = isAccepted && hasPermission([PERMISSIONS.RESULT.CREATE]);
    const canEdit = isAccepted && hasPermission([PERMISSIONS.RESULT.UPDATE]);
    const canDelete = false //&& isAccepted && hasPermission([PERMISSIONS.RESULT.DELETE]);

    const {
        items: results,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Result>();

    const [result, setResult] = useState<Result | undefined>(undefined);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /* --------------------------------------------
       Fetch results ONLY
    --------------------------------------------- */
    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const data = await ResultApi.getResults({ reviewer });
                setAll(data);
            } catch (err: any) {
                setError("Failed to load results. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [reviewer]);

    /* --------------------------------------------
       Save / Update / Delete
    --------------------------------------------- */
    const onSaveComplete = (saved: Result) => {
        updateItem(saved);
        hideSaveDialog();
    };

    const deleteResult = async (row: Result) => {
        const deleted = await ResultApi.deleteResult(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setResult(undefined);
        setShowSaveDialog(false);
    };

    /* --------------------------------------------
       Helpers
    --------------------------------------------- */
    const scoreTemplate = (row: Result) => {
        const criterion = row.criterion as Criterion;
        if (!criterion) return "-";

        if (criterion.formType === FormType.closed) {
            const opt = row.selectedOption as any;
            return opt ? `${opt.title} (${opt.score})` : "-";
        }
        return row.score ?? "-";
    };

    const totalWeight = useMemo(() => {
        return results.reduce((sum, r) => {
            const weight = (r.criterion as any)?.weight ?? 0;
            return sum + weight;
        }, 0);
    }, [results]);

    const totalScore = useMemo(() => {
        return results.reduce((sum, row) => {
            const criterion = row.criterion as Criterion;
            if (!criterion) return sum;

            // closed form → option score
            if (criterion.formType === FormType.closed) {
                const opt = row.selectedOption as any;
                return sum + (typeof opt?.score === "number" ? opt.score : 0);
            }

            // open form → direct score
            return sum + (typeof row.score === "number" ? row.score : 0);
        }, 0);
    }, [results]);

    /* --------------------------------------------
       Columns
    --------------------------------------------- */
    const columns = [
        { header: "Criterion", field: "criterion.title" },
        {
            header: "Weight", field: "criterion.weight",
            footer: <strong>Total: {totalWeight}</strong>
        },
        {
            header: "Score",
            field: "score",
            body: (row: Result) => scoreTemplate(row),
            footer: <strong>Total: {totalScore}</strong>
        },
        { header: "Comment", field: "comment" }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Results"
                items={results}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                //toolbarEnd={endToolbarTemplate()}

                onEdit={(row) => {
                    setResult(row);
                    setShowSaveDialog(true);
                }}
                onDelete={(row: any) =>
                    confirm.ask({
                        item: (row.criterion as Criterion)?.title ?? "result",
                        onConfirmAsync: () => deleteResult(row)
                    })
                }
            />

            {showSaveDialog && (
                <SaveResultDialog
                    visible={showSaveDialog}
                    result={result}
                    onCompelete={onSaveComplete}
                    onHide={hideSaveDialog}
                />
            )}
        </>
    );
};

export default ResultManager;
