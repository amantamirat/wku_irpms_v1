'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';
import { ItemManager, ItemManagerProps } from "@/components/ItemManager";
import { useToast } from "@/contexts/ToastContext";
import { Evaluation, FilterEvaluationsOptions } from "../models/evaluation.model";
import { EvaluationApi } from "../api/evaluation.api";
import EvaluationForm from "./EvaluationForm";
import EvaluationDetail from "./EvaluationDetail";
import { EVAL_TRANSITIONS } from "../models/evaluation.state-machine";
import MyBadge from "@/templates/MyBadge";
import { MENU_ICONS } from '@/utils/menu-icons';

// Defined outside component for stable reference
const columns: ColumnProps[] = [
    { header: "Title", field: "title", sortable: true },
    { header: "Description", field: "description" },
    {
        header: "Weight",
        field: "weight",
        sortable: true,
        body: (e: Evaluation) => (
            <span className="font-semibold">
                {e.weight ?? 0}%
            </span>
        ),
        style: { width: '10%' }
    },
    {
        field: "status",
        header: "Status",
        sortable: true,
        body: (e: Evaluation) =>
            <MyBadge type="status" value={e.status ?? "Unknown"} />
    }
];

export default function EvaluationManager() {
    const toast = useToast();

    // Memoize tableProps configuration to maintain stable reference
    const tableProps: ItemManagerProps<Evaluation, FilterEvaluationsOptions>["tableProps"] = useMemo(() => ({
        expandable: {
            template: (evaluation) => <EvaluationDetail evaluation={evaluation} />
        }
    }), []);

    return (
        <ItemManager<Evaluation, FilterEvaluationsOptions>
            api={EvaluationApi}
            resource="evaluation"
            itemName="Evaluation"
            headerTitle="Manage Evaluations"
            itemIcon={MENU_ICONS.evaluations}
            columns={columns}
            tableProps={tableProps}
            dialogWidth="600px"
            statusField="status"
            transitions={EVAL_TRANSITIONS}
            renderForm={(props) => <EvaluationForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === "create"
                        ? "Evaluation created successfully"
                        : "Evaluation updated successfully"
                )
            }
        />
    );
}