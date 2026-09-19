import { HistoryRule } from "./history.model";

export enum HistoryContext {
    CALL = "CALL",
    ORGANIZATION = "ORGANIZATION",
    CALENDAR = "CALENDAR",
    SOURCE = "SOURCE",
}

export type HistoryRuleReference = {
    context: HistoryContext;
    rule: string | HistoryRule;
};