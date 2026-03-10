import { createEntityManager } from "@/components/createEntityManager";
import { createEmptyStage, GetStagesDTO, Stage } from "../models/stage.model";
import { StageApi } from "../api/stage.api";
import SaveStage from "./SaveStage";

export default createEntityManager<Stage, GetStagesDTO>({
    title: "Manage Stages",
    //itemName: "Stage",
    api: StageApi,
    columns: [
        { header: "Name", field: "name" },
        { header: "Order", field: "order" },
        {
            header: "Evaluation",
            body: (s: Stage) =>
                typeof s.evaluation === "object"
                    ? s.evaluation?.title
                    : s.evaluation
        }
    ],
    createNew: createEmptyStage,
    SaveDialog: SaveStage,
    permissionPrefix: "grant_stage"
});