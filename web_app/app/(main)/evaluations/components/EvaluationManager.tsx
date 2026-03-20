'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Evaluation, GetEvaluationsOptions } from "../models/evaluation.model";
import { EvaluationApi } from "../api/evaluation.api";
import SaveEvaluation from "./SaveEvaluation";
import EvaluationDetail from "./EvaluationDetail";
import { EVAL_STATUS_ORDER, EVAL_TRANSITIONS } from "../models/evaluation.state-machine";
import MyBadge from "@/templates/MyBadge";

const EvaluationManager = () => {

    const Manager = createEntityManager<Evaluation, GetEvaluationsOptions | undefined>({
        title: "Manage Evaluations",
        itemName: "Evaluation",
        api: EvaluationApi,

        columns: [
            { header: "Title", field: "title", sortable: true },
            { header: "Description", field: "description" },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (e: Evaluation) =>
                    <MyBadge type="status" value={e.status ?? "Unknown"} />
            }
        ],

        createNew: () => ({
            title: "",
        }),

        SaveDialog: SaveEvaluation,
        permissionPrefix: "evaluation",

        workflow: {
            statusField: "status",
            transitions: EVAL_TRANSITIONS,
            statusOrder: EVAL_STATUS_ORDER
        },

        expandable: {
            template: (evaluation) => (
                <EvaluationDetail evaluation={evaluation} />
            )
        }
    });

    return <Manager />;
};

export default EvaluationManager;