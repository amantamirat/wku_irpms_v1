import { HistoryContext, IHistoryRule } from "./history.model";



export type HistoryRuleReference = {
    context: HistoryContext;
    rule: string | IHistoryRule;
};