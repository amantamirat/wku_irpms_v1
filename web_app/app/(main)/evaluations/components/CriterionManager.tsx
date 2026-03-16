'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { Criterion, GetCriteriaOptions, createEmptyCriterion } from "../models/criterion.model";
import { CriterionApi } from "../api/criterion.api";
import SaveCriterion from "./SaveCriterion";
import { Evaluation } from "../../evaluations/models/evaluation.model";
import CriterionDetail from "./CriterionDetail";

interface CriterionManagerProps {
    evaluation?: Evaluation;
}

const CriterionManager = ({ evaluation }: CriterionManagerProps) => {

    // Define the Manager using the factory
    const Manager = createEntityManager<Criterion, GetCriteriaOptions | undefined>({
        title: "Manage Criteria",
        itemName: "Criterion",
        api: CriterionApi,
        permissionPrefix: "criterion", // Matches PERMISSIONS.CRITERION        
        // Data fetching configuration
        query: () => ({ evaluation: evaluation ?? undefined }),
        // Initial state for new items
        createNew: () => ({
            ...createEmptyCriterion(),
            evaluation: evaluation ?? ""
        }),

        columns: [
            { header: "Title", field: "title" },
            { header: "Weight", field: "weight" },
            {
                header: "Form Type",
                field: "formType",
                body: (row: Criterion) => (
                    <span className={`form-badge form-type-${row.formType?.toLowerCase()}`}>
                        {row.formType}
                    </span>
                )
            },
        ],
        SaveDialog: SaveCriterion,
        expandable: {
            template: (criterion) => (
                <CriterionDetail criterion={criterion} />
            )
        }
    });

    return <Manager />;
};

export default CriterionManager;