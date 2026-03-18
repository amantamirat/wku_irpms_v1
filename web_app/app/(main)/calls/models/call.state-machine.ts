import { CallStatus } from "./call.model";


export const CALL_STATUS_ORDER: CallStatus[] = [
    CallStatus.planned,
    CallStatus.active,
    CallStatus.closed
];

export const CALL_TRANSITIONS: Record<CallStatus, CallStatus[]> = {
    [CallStatus.planned]: [CallStatus.active],
    [CallStatus.active]: [CallStatus.closed, CallStatus.planned],
    [CallStatus.closed]: [CallStatus.active]
};