'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { Evaluation } from "../../evaluations/models/evaluation.model";
import { CriterionApi } from "../api/criterion.api";
import { Criterion, GetCriteriaOptions, createEmptyCriterion, FormType } from "../models/criterion.model";
import SaveCriterion from "./SaveCriterion";
import { Tag } from 'primereact/tag';

interface CriterionManagerProps {
    evaluation?: Evaluation;
}

const CriterionManager = ({ evaluation }: CriterionManagerProps) => {

    const Manager = createEntityManager<Criterion, GetCriteriaOptions | undefined>({
        title: "Manage Evaluation Criteria",
        itemName: "Criterion",
        api: CriterionApi,
        permissionPrefix: "criterion",
        query: () => ({
            evaluation: evaluation?._id ?? undefined,
            populate: false // We only need the IDs here
        }),
        createNew: () => ({
            ...createEmptyCriterion(),
            evaluation: evaluation ?? ""
        }),

        columns: [
            // ✅ Show the execution order
            {
                header: "Order",
                field: "order",
                sortable: true,
                style: { width: '3rem' }
            },
            {
                header: "Title",
                field: "title",
                sortable: true
            },
            {
                header: "Weight",
                field: "weight",
                sortable: true,
                body: (rowData: Criterion) => (
                    <span className="font-bold text-primary">{rowData.weight}%</span>
                )
            },
            {
                header: "Type",
                field: "formType",
                body: (rowData: Criterion) => {
                    const severity = rowData.formType === FormType.OPEN ? 'info' : 'success';
                    return <Tag value={rowData.formType} severity={severity} />;
                }
            },
            // ✅ Dynamic column to show how many options are attached
            {
                header: "Options",
                body: (rowData: Criterion) => {
                    const count = rowData.options?.length || 0;
                    return count > 0 ? (
                        <Tag value={`${count} Options`} icon="pi pi-list" severity="warning" />
                    ) : (
                        <span className="text-400 italic text-sm">N/A</span>
                    );
                }
            }
        ],
        SaveDialog: SaveCriterion,
        importConfig: {
            allow: !!evaluation,
            parentId: evaluation?._id
        }
    });

    return <Manager />;
};

export default CriterionManager;