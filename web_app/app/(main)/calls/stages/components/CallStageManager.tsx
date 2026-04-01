'use client';

import { GrantStage } from "@/app/(main)/grants/stages/models/grant.stage.model";
import { createEntityManager } from "@/components/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Call } from "../../models/call.model";
import { CallStageApi } from "../api/call.stage.api";
import { CallStage, GetCallStagesDTO, createEmptyCallStage } from "../models/call.stage.model";
import { CALL_STAGE_STATUS_ORDER, CALL_STAGE_TRANSITIONS, CallStageStatus } from "../models/call.stage.state-machine";
import SaveCallStage from "./SaveCallStage";

interface CallStageManagerProps {
    call?: Call;
}

const CallStageManager = ({ call }: CallStageManagerProps) => {

    const Manager = createEntityManager<CallStage, GetCallStagesDTO | undefined>({
        title: "Manage Call Stages",
        itemName: "Call Stage",
        api: CallStageApi,

        columns: [
            {
                header: "Stage",
                field: "grantStage",
                body: (cs: CallStage) =>
                    typeof cs.grantStage === "object"
                        ? (cs.grantStage as GrantStage)?.name
                        : cs.grantStage
            },

            {
                header: "Deadline",
                field: "deadline",
                body: (cs: CallStage) =>
                    cs.deadline
                        ? new Date(cs.deadline).toLocaleDateString()
                        : "-"
            },

            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (cs: CallStage) =>
                    <MyBadge type="status" value={cs.status ?? "Unknown"} />
            }
        ],

        /*
        createNew: () => createEmptyCallStage({
            call
        }),*/

        disableDeleteRow: (row: CallStage) => true,
        SaveDialog: SaveCallStage,
        permissionPrefix: "call.stage",

        query: () => ({
            call: call ?? undefined,
            populate: true
        }),

        workflow: {
            statusField: "status",
            transitions: CALL_STAGE_TRANSITIONS,
            statusOrder: CALL_STAGE_STATUS_ORDER
        }
    });

    return <Manager />;
};

export default CallStageManager;