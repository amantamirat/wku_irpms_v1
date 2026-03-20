'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { Grant } from "../../models/grant.model";
import { GrantStageApi } from "../api/grant.stage.api";
import { createEmptyGrantStage, GetStagesDTO, GrantStage } from "../models/grant.stage.model";
import SaveStage from "./SaveGrantStage";
import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";

interface StageManagerProps {
    grant?: Grant;
    evaluation?: Evaluation;
}

const StageManager = ({ grant, evaluation }: StageManagerProps) => {
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
                    typeof s.evaluation === "object" ? s.evaluation?.title : s.evaluation
            },
            {
                field: 'minReviewers',
                header: 'Min. Reviewers',
                style: { width: '10rem' },
                body: (rowData: GrantStage) => rowData.minReviewers ?? '-'
            },
            {
                field: 'maxReviewers',
                header: 'Max. Reviewers',
                style: { width: '10rem' },
                body: (rowData: GrantStage) => rowData.maxReviewers ?? '-'
            },
        ],
        createNew: () =>
            createEmptyGrantStage({ grant, evaluation }),
        SaveDialog: SaveStage,
        permissionPrefix: "grant.stage",
        query: () => ({
            grant: grant ?? undefined,
            evaluation: evaluation ?? undefined,
            populate: true
        })
    });

    return <Manager />;
};

export default StageManager;