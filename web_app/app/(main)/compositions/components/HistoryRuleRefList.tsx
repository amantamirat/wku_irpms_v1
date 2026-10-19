'use client';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

import {
    HistoryContext,
    HistoryRuleReference
} from '../models/history-rule-reference.model';

export interface LookupOption {
    label: string;
    value: string;
}

const CONTEXT_OPTIONS = Object.values(HistoryContext).map((c) => ({
    label: c,
    value: c
}));

/** Turns entities with a name/description into dropdown options. */
export const toLookupOptions = (
    items: { _id?: string; name: string; description?: string }[]
): LookupOption[] =>
    items
        .filter((i) => i._id)
        .map((i) => ({
            label: i.description ? `${i.name} (${i.description})` : i.name,
            value: i._id as string
        }));

/** Reduces a populated reference to its id so it can be saved. */
export const normalizeRefs = (
    refs?: HistoryRuleReference[]
): HistoryRuleReference[] =>
    (refs ?? []).map((hr) => ({
        context: hr.context ?? HistoryContext.CALL,
        rule:
            typeof hr.rule === 'object' && hr.rule !== null
                ? ((hr.rule as { _id?: string })._id ?? '')
                : ((hr.rule as string) ?? '')
    }));

interface Props {
    title: string;
    value: HistoryRuleReference[];
    options: LookupOption[];
    disabled?: boolean;
    loading?: boolean;
    showErrors?: boolean;
    onChange: (next: HistoryRuleReference[]) => void;
}

const HistoryRuleRefList = ({
    title,
    value,
    options,
    disabled,
    loading,
    showErrors,
    onChange
}: Props) => {
    const add = () =>
        onChange([...value, { context: HistoryContext.CALL, rule: '' }]);

    const remove = (index: number) =>
        onChange(value.filter((_, i) => i !== index));

    const update = (index: number, patch: Partial<HistoryRuleReference>) =>
        onChange(
            value.map((hr, i) => (i === index ? { ...hr, ...patch } : hr))
        );

    return (
        <div className="p-3 border-1 surface-border border-round surface-card">
            <div className="flex justify-content-between align-items-center mb-3">
                <span className="font-semibold text-900">{title}</span>
                <Button
                    type="button"
                    label="Add"
                    icon="pi pi-plus"
                    size="small"
                    text
                    disabled={disabled}
                    onClick={add}
                    className="w-auto"
                />
            </div>

            {value.length === 0 ? (
                <small className="text-500 italic">
                    None attached. Click "Add" to include history criteria.
                </small>
            ) : (
                value.map((hr, index) => {
                    const ruleId = typeof hr.rule === 'string' ? hr.rule : '';
                    const invalid = showErrors && !ruleId;

                    return (
                        <div
                            key={index}
                            className="grid align-items-end surface-ground border-round p-2 mb-2 m-0"
                        >
                            <div className="col-12 md:col-4">
                                <label className="block text-xs text-600 mb-1">
                                    Context
                                </label>
                                <Dropdown
                                    value={hr.context}
                                    options={CONTEXT_OPTIONS}
                                    disabled={disabled}
                                    onChange={(e) =>
                                        update(index, { context: e.value })
                                    }
                                />
                            </div>

                            <div className="col-10 md:col-7">
                                <label className="block text-xs text-600 mb-1">
                                    Rule
                                </label>
                                <Dropdown
                                    value={ruleId || null}
                                    options={options}
                                    disabled={disabled || loading}
                                    onChange={(e) =>
                                        update(index, { rule: e.value ?? '' })
                                    }
                                    placeholder={
                                        loading ? 'Loading…' : 'Select history rule'
                                    }
                                    filter
                                    className={invalid ? 'p-invalid' : undefined}
                                />
                            </div>

                            <div className="col-2 md:col-1 flex justify-content-end">
                                <Button
                                    type="button"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    text
                                    rounded
                                    disabled={disabled}
                                    onClick={() => remove(index)}
                                    aria-label="Remove reference"
                                    className="w-auto"
                                />
                            </div>
                        </div>
                    );
                })
            )}

            {showErrors && value.some((hr) => !hr.rule) && (
                <small className="p-error block mt-1">
                    Select a rule for every reference, or remove the empty ones.
                </small>
            )}
        </div>
    );
};

export default HistoryRuleRefList;