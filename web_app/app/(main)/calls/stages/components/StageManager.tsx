'use client';

import { Evaluation } from "@/app/(main)/evaluations/models/evaluation.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Call } from "../../models/call.model";
import { StageApi } from "../api/stage.api";
import {
    createEmptyCallStage,
    GetStagesDTO,
    Stage
} from "../models/stage.model";
import {
    CALL_STAGE_STATUS_ORDER,
    CALL_STAGE_TRANSITIONS
} from "../models/stage.state-machine";
import SaveStage from "./SaveStage";

interface StageManagerProps {
    call?: Call;
    evaluation?: Evaluation;
}

const StageManager = ({ call, evaluation }: StageManagerProps) => {
    const Manager = createEntityManager<Stage, GetStagesDTO | undefined>({
        title: "Manage Stages",
        itemName: "Stage",
        api: StageApi,

        columns: [
            {
                header: "Name",
                field: "name"
            },
            {
                header: "Order",
                field: "order",
                style: { width: "6rem" }
            },
            {
                header: "Evaluation",
                field: "evaluation",
                body: (s: Stage) =>
                    typeof s.evaluation === "object"
                        ? s.evaluation?.title
                        : s.evaluation ?? "-"
            },
            {
                header: "Min Reviewers",
                field: "minReviewers",
                style: { width: "8rem" },
                body: (row: Stage) => row.minReviewers ?? "-"
            },
            {
                header: "Max Reviewers",
                field: "maxReviewers",
                style: { width: "8rem" },
                body: (row: Stage) => row.maxReviewers ?? "-"
            },
            {
                header: "Min Score",
                field: "minAcceptanceScore",
                style: { width: "8rem" },
                body: (row: Stage) => row.minAcceptanceScore !== undefined ? `${row.minAcceptanceScore}` : "-"
            },
            {
                header: "Deadline",
                field: "deadline",
                style: { width: "12rem" }, // Slightly increased width to fit date + time comfortably
                body: (s: Stage) =>
                    s.deadline
                        ? new Date(s.deadline).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                        })
                        : "-"
            },
            {
                /**
                 * 
                 * {
                header: "Status",
                field: "status",
                sortable: true,
                style: { width: "10rem" },
                body: (s: Stage) => <MyBadge type="status" value={s.status ?? "Unknown"} />
            }
                 */
            }

        ],

        createNew: () =>
            createEmptyCallStage({
                call,
                evaluation,

            }),

        SaveDialog: SaveStage,

        permissionPrefix: "call.stage",

        query: () => ({
            call: call ?? undefined,
            evaluation: evaluation ?? undefined,
            populate: true
        }),


    });

    return <Manager />;
};

export default StageManager;