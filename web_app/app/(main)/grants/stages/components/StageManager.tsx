'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { Grant } from "../../models/grant.model";
import { StageApi } from "../api/stage.api";
import { createEmptyStage, GetStagesDTO, Stage } from "../models/stage.model";
import SaveStage from "./SaveStage";
import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";

interface StageManagerProps {
    grant?: Grant;
    evaluation?: Evaluation;
}

const StageManager = ({ grant, evaluation }: StageManagerProps) => {
    const Manager = createEntityManager<Stage, GetStagesDTO | undefined>({
        title: "Manage Stages",
        itemName: "Stage",
        api: StageApi,
        columns: [
            { header: "Name", field: "name" },
            { header: "Order", field: "order" },
            {
                header: "Evaluation",
                field: "evaluation",
                body: (s: Stage) =>
                    typeof s.evaluation === "object" ? s.evaluation?.title : s.evaluation
            }
        ],
        createNew: () =>
            createEmptyStage({ grant, evaluation }),
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