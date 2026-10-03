import { HistoryRule } from "./history.model";

export enum HistoryContext {
    CALL = "CALL",
    STAGE = "STAGE",
    ORGANIZATION = "ORGANIZATION",
    CALENDAR = "CALENDAR",
    SOURCE = "SOURCE",
}

export type HistoryRuleReference = {
    context: HistoryContext;
    rule: string | HistoryRule;
};