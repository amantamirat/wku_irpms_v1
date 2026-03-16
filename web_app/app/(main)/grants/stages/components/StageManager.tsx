'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { createEmptyStage, GetStagesDTO, Stage } from "../models/stage.model";
import { StageApi } from "../api/stage.api";
import SaveStage from "./SaveStage";
import { Grant } from "../../models/grant.model";

interface StageManagerProps {
    grant?: Grant;
}

const StageManager = ({ grant }: StageManagerProps) => {
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

        createNew: () => ({
            ...createEmptyStage(),
            grant: grant ?? ""
        }),
        SaveDialog: SaveStage,
        permissionPrefix: "grant_stage",
        query: () => ({ grant: grant ?? undefined })
    });

    return <Manager />;
};

export default StageManager;