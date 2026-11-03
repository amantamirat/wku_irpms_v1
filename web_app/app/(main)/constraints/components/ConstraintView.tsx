// reports/components/ConstraintView.tsx
'use client';

import React, { useMemo } from 'react';
import { Divider } from 'primereact/divider';

import { Constraint } from '../models/constraint.model';
import { IRange, formatRange } from '@/types/range';
import { etbCurrencyFormatter } from '@/utils/utils';
import { SECTIONS, RangeFieldConfig } from './ConstraintForm';

interface ConstraintViewProps {
    constraint: Constraint;
    title?: string;
}

interface RuleConfig extends RangeFieldConfig {
    range?: IRange;
    formatter?: (val: number) => string;
}

interface RuleSection {
    title: string;
    subtitle: string;
    icon: string;
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

// Helper to determine appropriate default formatters based on field units/types
const getFormatter = (key: string, currency?: boolean) => {
    if (currency) return currencyFormat;
    if (key.includes('Duration') || key === 'duration') return days;
    if (key.includes('Words') || key === 'titleWords' || key === 'summaryWords' || key === 'generalObjectiveWords' || key === 'specificObjectiveWords' || key === 'expectedOutputWords') return words;
    if (key === 'keyWords') return unit('keyword');
    if (key === 'participants') return unit('person', 'people');
    if (key === 'phases') return unit('phase');
    if (key === 'activities') return unit('activity', 'activities');
    if (key === 'equipments') return unit('item');
    if (key === 'components') return unit('component');
    if (key === 'componentCollaborators') return unit('contributor');
    if (key === 'specificObjectives') return unit('objective');
    if (key === 'expectedOutputs') return unit('output');
    if (key === 'themes') return unit('theme');
    if (key === 'subThemes') return unit('sub-theme');
    if (key === 'focusAreas') return unit('area');
    if (key === 'indicators') return unit('indicator');
    return undefined;
};

const hasRange = (r: RuleConfig): r is RuleConfig & { range: IRange } =>
    !!r.range && (r.range.min != null || r.range.max != null);

export const ConstraintView: React.FC<ConstraintViewProps> = ({
    constraint,
    title = 'Constraint Details'
}) => {
    const sections = useMemo<RuleSection[]>(() => {
        // Map over the shared SECTIONS array from ConstraintForm
        const mappedSections: RuleSection[] = SECTIONS.map((section) => ({
            title: section.title,
            subtitle: section.subtitle,
            icon: section.icon,
            rules: section.fields.map((field) => ({
                ...field,
                range: constraint[field.key as keyof Constraint] as IRange | undefined,
                formatter: getFormatter(field.key, field.currency)
            }))
        }));

        // Keep only configured rules, and drop sections that end up empty
        return mappedSections
            .map((s) => ({ ...s, rules: s.rules.filter(hasRange) }))
            .filter((s) => s.rules.length > 0);
    }, [constraint]);

    const totalRules = sections.reduce((n, s) => n + s.rules.length, 0);

    return (
        <div className="constraint-view p-4 surface-card border-round-xl shadow-2">
            <h4 className="mt-0 mb-1 text-primary flex align-items-center gap-2 text-xl font-bold">
                <i className="pi pi-sliders-h text-xl"></i>
                {constraint.name || title}
            </h4>

            <p className="text-sm line-height-3 text-600 mb-3">
                {constraint.description ||
                    'No specific description provided for this constraint set.'}
            </p>

            <Divider align="left" className="my-3">
                <span className="p-tag p-tag-info text-xs uppercase font-bold px-3 py-1 border-round-pill">
                    Configured Rules ({totalRules})
                </span>
            </Divider>

            {sections.length > 0 ? (
                sections.map((section) => (
                    <div key={section.title} className="mb-4">
                        <div
                            className="text-500 font-bold uppercase px-2 mb-2"
                            style={{ fontSize: '11px', letterSpacing: '0.05em' }}
                        >
                            {section.title}
                        </div>

                        <div className="grid">
                            {section.rules.map((rule) => (
                                <div key={rule.key} className="col-12 md:col-6 p-2">
                                    <div className="flex align-items-center p-3 border-round-xl surface-50 border-1 surface-border h-full shadow-sm hover:shadow-2 transition-all transition-duration-200">
                                        <div className="w-2.5rem h-2.5rem border-round-circle surface-primary flex align-items-center justify-content-center mr-3 shadow-sm shrink-0">
                                            <i className={`${section.icon} text-primary text-base`} />
                                        </div>
                                        <div className="flex flex-column overflow-hidden">
                                            <span
                                                className="text-500 font-bold uppercase text-overflow-ellipsis white-space-nowrap"
                                                style={{ fontSize: '10px', letterSpacing: '0.03em' }}
                                            >
                                                {rule.label}
                                            </span>
                                            <span className="text-900 text-sm font-semibold mt-1">
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
                <div className="p-3 surface-50 text-600 border-round-xl text-xs italic border-1 surface-border flex align-items-center gap-2">
                    <i className="pi pi-info-circle text-primary" />
                    <span>No active limits or parameters defined for this constraint model.</span>
                </div>
            )}
        </div>
    );
};