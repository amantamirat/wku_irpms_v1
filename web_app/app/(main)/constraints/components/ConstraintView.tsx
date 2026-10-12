'use client';

import React from 'react';
import { Divider } from 'primereact/divider';

import { Constraint } from '../models/constraint.model';
import { IRange, formatRange } from '@/types/range';
import { etbCurrencyFormatter } from '@/utils/utils';

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
    title = 'Constraint Details'
}) => {

    const currencyFormat = (val: number) =>
        etbCurrencyFormatter.format(val);

    const wordFormat = (val: number) =>
        `${val} words`;

    const rules: RuleConfig[] = [
        // Project content
        {
            label: 'Title Words',
            icon: 'pi pi-align-left',
            range: constraint.titleWords,
            formatter: wordFormat
        },
        {
            label: 'Summary Words',
            icon: 'pi pi-align-justify',
            range: constraint.summaryWords,
            formatter: wordFormat
        },

        // Objectives & Outputs
        {
            label: 'General Objective Words',
            icon: 'pi pi-file',
            range: constraint.generalObjectiveWords,
            formatter: wordFormat
        },
        {
            label: 'Specific Objective Words',
            icon: 'pi pi-file-edit',
            range: constraint.specificObjectiveWords,
            formatter: wordFormat
        },
        {
            label: 'Specific Objectives',
            icon: 'pi pi-list',
            range: constraint.specificObjectives,
            formatter: (v: any) => `${v} objectives`
        },
        {
            label: 'Expected Outputs',
            icon: 'pi pi-check-circle',
            range: constraint.expectedOutputs,
            formatter: (v: any) => `${v} outputs`
        },
        {
            label: 'Expected Output Words',
            icon: 'pi pi-pencil',
            range: constraint.expectedOutputWords,
            formatter: wordFormat
        },

        // Project structure & execution
        {
            label: 'Participants',
            icon: 'pi pi-users',
            range: constraint.participants
        },
        {
            label: 'Phases',
            icon: 'pi pi-list-check',
            range: constraint.phases
        },
        {
            label: 'Budget',
            icon: 'pi pi-dollar',
            range: constraint.budget,
            formatter: currencyFormat
        },
        {
            label: 'Duration',
            icon: 'pi pi-clock',
            range: constraint.duration,
            formatter: (v: any) => `${v} days`
        },
        {
            label: 'Budget Per Phase',
            icon: 'pi pi-wallet',
            range: constraint.budgetPerPhase,
            formatter: currencyFormat
        },
        {
            label: 'Duration Per Phase',
            icon: 'pi pi-hourglass',
            range: constraint.durationPerPhase,
            formatter: (v: any) => `${v} days`
        },
        {
            label: 'Activities Per Phase',
            icon: 'pi pi-check-square',
            range: constraint.activitiesPerPhase,
            formatter: (v: any) => `${v} activities`
        },
        {
            label: 'Equipments Per Phase',
            icon: 'pi pi-box',
            range: constraint.equipmentsPerPhase,
            formatter: (v: any) => `${v} items`
        },

        // Taxonomy
        {
            label: 'Themes',
            icon: 'pi pi-bookmark',
            range: constraint.themes,
            formatter: (v: any) => `${v} themes`
        },
        {
            label: 'Sub-Themes',
            icon: 'pi pi-tags',
            range: constraint.subThemes,
            formatter: (v: any) => `${v} sub-themes`
        },
        {
            label: 'Focus Areas',
            icon: 'pi pi-compass',
            range: constraint.focusAreas,
            formatter: (v: any) => `${v} areas`
        },
        {
            label: 'Indicators',
            icon: 'pi pi-chart-line',
            range: constraint.indicators,
            formatter: (v: any) => `${v} indicators`
        }
    ].filter(
        (r) =>
            r.range &&
            (r.range.min != null || r.range.max != null)
    );

    return (
        <div className="constraint-view p-3 surface-card border-round shadow-1">

            <h4 className="mt-0 mb-1 text-primary flex align-items-center">
                <i className="pi pi-sliders-h mr-2"></i>
                {constraint.name || title}
            </h4>

            <p className="text-sm line-height-3 text-600 mb-3">
                {constraint.description ||
                    'No specific description provided for this constraint set.'}
            </p>

            <Divider align="left">
                <span className="p-tag p-tag-info text-xs uppercase">
                    Configured Rules
                </span>
            </Divider>

            {rules.length > 0 ? (
                <div className="grid">
                    {rules.map((rule, idx) => (
                        <div
                            key={idx}
                            className="col-12 md:col-6 p-2"
                        >
                            <div className="flex align-items-center p-2 border-round surface-50 border-1 border-200 h-full">
                                <i
                                    className={`${rule.icon} mr-3 text-primary text-xl`}
                                />
                                <div className="flex flex-column">
                                    <span
                                        className="text-500 font-bold uppercase"
                                        style={{ fontSize: '10px' }}
                                    >
                                        {rule.label}
                                    </span>
                                    <span className="text-900 text-sm font-semibold">
                                        {formatRange(
                                            rule.range,
                                            rule.formatter
                                        )}
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