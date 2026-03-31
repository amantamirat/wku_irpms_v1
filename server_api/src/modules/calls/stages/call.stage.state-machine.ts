import { CallStageStatus } from "./call.stage.model";


export const STAGE_TRANSITIONS: Record<CallStageStatus, CallStageStatus[]> = {
    [CallStageStatus.planned]: [CallStageStatus.active],
    [CallStageStatus.active]: [CallStageStatus.closed, CallStageStatus.planned],
    [CallStageStatus.closed]: [CallStageStatus.active]
};
