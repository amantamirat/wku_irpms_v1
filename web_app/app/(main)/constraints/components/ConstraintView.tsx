'use client';

import React, { useMemo } from 'react';
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

interface RuleSection {
    title: string;
    rules: RuleConfig[];
}

/* ---------- Formatters ---------- */

const currencyFormat = (val: number) => etbCurrencyFormatter.format(val);

// Handles singular/plural: "1 day", "5 days"
const unit =
    (singular: string, plural = `${singular}s`) =>
    (val: number) =>
        `${val} ${val === 1 ? singular : plural}`;

const words = unit('word');
const days = unit('day');

const hasRange = (r: RuleConfig): r is RuleConfig & { range: IRange } =>
    !!r.range && (r.range.min != null || r.range.max != null);

export const ConstraintView: React.FC<ConstraintViewProps> = ({
    constraint,
    title = 'Constraint Details'
}) => {
    const sections = useMemo<RuleSection[]>(() => {
        const all: RuleSection[] = [
            {
                title: 'Project Content',
                rules: [
                    { label: 'Title Words', icon: 'pi pi-align-left', range: constraint.titleWords, formatter: words },
                    { label: 'Summary Words', icon: 'pi pi-align-justify', range: constraint.summaryWords, formatter: words }
                ]
            },
            {
                title: 'Objectives & Outputs',
                rules: [
                    { label: 'General Objective Words', icon: 'pi pi-file', range: constraint.generalObjectiveWords, formatter: words },
                    { label: 'Specific Objective Words', icon: 'pi pi-file-edit', range: constraint.specificObjectiveWords, formatter: words },
                    { label: 'Specific Objectives', icon: 'pi pi-list', range: constraint.specificObjectives, formatter: unit('objective') },
                    { label: 'Expected Outputs', icon: 'pi pi-check-circle', range: constraint.expectedOutputs, formatter: unit('output') },
                    { label: 'Expected Output Words', icon: 'pi pi-pencil', range: constraint.expectedOutputWords, formatter: words }
                ]
            },
            {
                title: 'Project Structure',
                rules: [
                    { label: 'Participants', icon: 'pi pi-users', range: constraint.participants },
                    { label: 'Phases', icon: 'pi pi-list-check', range: constraint.phases },
                    { label: 'Activities', icon: 'pi pi-check-square', range: constraint.activities, formatter: unit('activity', 'activities') },
                    { label: 'Equipments', icon: 'pi pi-box', range: constraint.equipments, formatter: unit('item') },
                    { label: 'Components', icon: 'pi pi-th-large', range: constraint.components, formatter: unit('component') }
                ]
            },
            {
                title: 'Budget & Duration',
                rules: [
                    { label: 'Budget', icon: 'pi pi-dollar', range: constraint.budget, formatter: currencyFormat },
                    { label: 'Duration', icon: 'pi pi-clock', range: constraint.duration, formatter: days },
                    { label: 'Phase Budget', icon: 'pi pi-wallet', range: constraint.phaseBudget, formatter: currencyFormat },
                    { label: 'Phase Duration', icon: 'pi pi-hourglass', range: constraint.phaseDuration, formatter: days },
                    { label: 'Activity Duration', icon: 'pi pi-stopwatch', range: constraint.activityDuration, formatter: days },
                    { label: 'Equipment Cost', icon: 'pi pi-money-bill', range: constraint.equipmentCost, formatter: currencyFormat }
                ]
            },
            {
                title: 'Taxonomy',
                rules: [
                    { label: 'Themes', icon: 'pi pi-bookmark', range: constraint.themes, formatter: unit('theme') },
                    { label: 'Sub-Themes', icon: 'pi pi-tags', range: constraint.subThemes, formatter: unit('sub-theme') },
                    { label: 'Focus Areas', icon: 'pi pi-compass', range: constraint.focusAreas, formatter: unit('area') },
                    { label: 'Indicators', icon: 'pi pi-chart-line', range: constraint.indicators, formatter: unit('indicator') }
                ]
            }
        ];

        // Keep only configured rules, and drop sections that end up empty
        return all
            .map((s) => ({ ...s, rules: s.rules.filter(hasRange) }))
            .filter((s) => s.rules.length > 0);
    }, [constraint]);

    const totalRules = sections.reduce((n, s) => n + s.rules.length, 0);

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
                    Configured Rules ({totalRules})
                </span>
            </Divider>

            {sections.length > 0 ? (
                sections.map((section) => (
                    <div key={section.title} className="mb-3">
                        <div
                            className="text-500 font-bold uppercase px-2 mb-1"
                            style={{ fontSize: '11px', letterSpacing: '0.05em' }}
                        >
                            {section.title}
                        </div>

                        <div className="grid">
                            {section.rules.map((rule) => (
                                <div key={rule.label} className="col-12 md:col-6 p-2">
                                    <div className="flex align-items-center p-2 border-round surface-50 border-1 border-200 h-full">
                                        <i className={`${rule.icon} mr-3 text-primary text-xl`} />
                                        <div className="flex flex-column">
                                            <span
                                                className="text-500 font-bold uppercase"
                                                style={{ fontSize: '10px' }}
                                            >
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
                    </div>
                ))
            ) : (
                <div className="p-3 bg-blue-50 text-blue-700 border-round text-xs italic">
                    No active limits or parameters defined for this constraint model.
                </div>
            )}
        </div>
    );
};