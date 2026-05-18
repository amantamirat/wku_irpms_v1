'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Grant } from "../../models/grant.model";
import { GrantStageApi } from "../api/grant.stage.api";
import {
    createEmptyGrantStage,
    GetStagesDTO,
    GrantStage,
    StageCategory
} from "../models/grant.stage.model";
import SaveStage from "./SaveGrantStage";
import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";

interface GrantStageManagerProps {
    grant?: Grant;
    evaluation?: Evaluation;
}

const GrantStageManager = ({ grant, evaluation }: GrantStageManagerProps) => {
    const Manager = createEntityManager<GrantStage, GetStagesDTO | undefined>({
        title: "Manage Stages",
        itemName: "Stage",
        api: GrantStageApi,

        columns: [
            { header: "Name", field: "name" },
            { header: "Order", field: "order" },

            {
                header: "Evaluation",
                field: "evaluation",
                body: (s: GrantStage) =>
                    typeof s.evaluation === "object"
                        ? s.evaluation?.title
                        : s.evaluation,
            },

            {
                header: "Min Reviewers",
                field: "minReviewers",
                style: { width: "10rem" },
                body: (row: GrantStage) => row.minReviewers ?? "-",
            },

            {
                header: "Max Reviewers",
                field: "maxReviewers",
                style: { width: "10rem" },
                body: (row: GrantStage) => row.maxReviewers ?? "-",
            },

            {
                header: "Category",
                field: "category",
                body: (row: GrantStage) =>
                    row.category === StageCategory.selection ? (
                        <span className="text-green-600 font-semibold">
                            Selection
                        </span>
                    ) : (
                        <span className="text-orange-500 font-semibold">
                            Verification
                        </span>
                    ),
            },



            // NEW: Acceptance Score
            {
                header: "Min Score",
                field: "minAcceptanceScore",
                style: { width: "10rem" },
                body: (row: GrantStage) =>
                    `${row.minAcceptanceScore ?? 0}%`
            },
        ],

        createNew: () =>
            createEmptyGrantStage({
                grant,
                evaluation,
            }),

        SaveDialog: SaveStage,

        permissionPrefix: "grant.stage",

        query: () => ({
            grant: grant ?? undefined,
            evaluation: evaluation ?? undefined,
            populate: true,
        }),
    });

    return <Manager />;
};

export default GrantStageManager;