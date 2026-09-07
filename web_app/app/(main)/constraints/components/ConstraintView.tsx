'use client';
import React from 'react';
import { Divider } from 'primereact/divider';
import { Constraint } from '../models/constraint.model';
import { IRange } from '@/types/range';
import { formatRange } from '@/utils/rangeUtil';
import { etbCurrencyFormatter } from '@/utils/currencyUtil';

interface ConstraintViewProps {
    constraint: Constraint;
    title?: string;
}

interface RuleConfig {
    label: string;
    icon: string;
    range?: IRange;
    formatter?: (val: number) => string;
}

export const ConstraintView: React.FC<ConstraintViewProps> = ({
    constraint,
    title = "Constraint Details"
}) => {
    const currencyFormat = (val: number) => etbCurrencyFormatter.format(val);

    const rules: RuleConfig[] = [
        { label: 'Participants', icon: 'pi pi-users', range: constraint.participants },
        { label: 'Phases', icon: 'pi pi-list-check', range: constraint.phases },
        { label: 'Budget', icon: 'pi pi-dollar', range: constraint.budget, formatter: currencyFormat },
        { label: 'Duration', icon: 'pi pi-clock', range: constraint.duration, formatter: (v: any) => `${v} days` },
        { label: 'Budget Per Phase', icon: 'pi pi-wallet', range: constraint.budgetPerPhase, formatter: currencyFormat },
        { label: 'Duration Per Phase', icon: 'pi pi-hourglass', range: constraint.durationPerPhase, formatter: (v: any) => `${v} days` },
        { label: 'Themes', icon: 'pi pi-bookmark', range: constraint.themes },
        { label: 'Sub-Themes', icon: 'pi pi-tags', range: constraint.subThemes },
        { label: 'Focus Areas', icon: 'pi pi-compass', range: constraint.focusAreas },
        { label: 'Indicators', icon: 'pi pi-chart-line', range: constraint.indicators }
    ].filter(r => r.range && (r.range.min != null || r.range.max != null));

    return (
        <div className="constraint-view p-3 surface-card border-round shadow-1">
            <h4 className="mt-0 mb-1 text-primary flex align-items-center">
                <i className="pi pi-sliders-h mr-2"></i>
                {constraint.name || title}
            </h4>

            <p className="text-sm line-height-3 text-600 mb-3">
                {constraint.description || "No specific description provided for this constraint set."}
            </p>

            <Divider align="left">
                <span className="p-tag p-tag-info text-xs uppercase">Configured Rules</span>
            </Divider>

            {rules.length > 0 ? (
                <div className="grid">
                    {rules.map((rule, idx) => (
                        <div key={idx} className="col-12 md:col-6 p-2">
                            <div className="flex align-items-center p-2 border-round surface-50 border-1 border-200 h-full">
                                <i className={`${rule.icon} mr-3 text-primary text-xl`} />
                                <div className="flex flex-column">
                                    <span className="text-500 font-bold uppercase" style={{ fontSize: '10px' }}>
                                        {rule.label}
                                    </span>
                                    <span className="text-900 text-sm font-semibold">
                                        {formatRange(rule.range, rule.formatter)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-3 bg-blue-50 text-blue-700 border-round text-xs italic">
                    No active limits or parameters defined for this constraint model.
                </div>
            )}
        </div>
    );
};