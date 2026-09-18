'use client';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import { Call } from "../../models/call.model";
import { StageApi } from "../api/stage.api";
import {
    createEmptyCallStage,
    FilterStagesDTO,
    Stage
} from "../models/stage.model";
import SaveStage from "./SaveStage";
import { STAGE_TRANSITIONS } from "../models/stage.state-machine";
import MyBadge from "@/templates/MyBadge";

interface StageManagerProps {
    call: Call
}

const StageManager = ({ call }: StageManagerProps) => {
    const Manager = createEntityManager<Stage, FilterStagesDTO | undefined>({
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
                field: "status",
                header: "Status",
                sortable: true,
                style: { width: '150px' },
                body: (c: Call) =>
                    <MyBadge type="status" value={c.status ?? "Unknown"} />
            }

        ],

        defaultHiddenFields: ["order", "evaluation"],

        createNew: () =>
            createEmptyCallStage({
                call,
            }),

        SaveDialog: SaveStage,

        permissionPrefix: "stage",

        query: () => ({
            call: call,
        }),
        workflow: {
            statusField: "status",
            transitions: STAGE_TRANSITIONS,
        },
    });

    return <Manager />;
};

export default StageManager;