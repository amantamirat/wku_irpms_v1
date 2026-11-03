'use client';

import { FormEvent, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { IRange } from '@/types/range';
import { Constraint } from '../models/constraint.model';

/* ---------- Types & config ---------- */

type RangeKey = {
    [K in keyof Constraint]-?: NonNullable<Constraint[K]> extends IRange ? K : never;
}[keyof Constraint];

export interface RangeFieldConfig {
    key: RangeKey;
    label: string;
    description: string;
    unit: string;
    currency?: boolean;
}

interface SectionConfig {
    title: string;
    subtitle: string;
    icon: string;
    fields: RangeFieldConfig[];
}

export const SECTIONS: SectionConfig[] = [
    {
        title: 'Content limits',
        subtitle: 'Control the size of project titles, summaries, and keywords.',
        icon: 'pi pi-file-edit',
        fields: [
            { key: 'titleWords', label: 'Title words', description: 'Allowed number of words in the project title.', unit: 'words' },
            { key: 'summaryWords', label: 'Summary words', description: 'Allowed number of words in the project summary.', unit: 'words' },
            { key: 'keyWords', label: 'Keywords', description: 'Allowed number of keywords for the project.', unit: 'keywords' }
        ]
    },
    {
        title: 'Objectives & outputs',
        subtitle: 'Limits for general/specific objectives and expected outputs.',
        icon: 'pi pi-check-circle',
        fields: [
            { key: 'generalObjectiveWords', label: 'General objective words', description: 'Allowed number of words for general objectives.', unit: 'words' },
            { key: 'specificObjectiveWords', label: 'Specific objective words', description: 'Allowed number of words per specific objective.', unit: 'words' },
            { key: 'specificObjectives', label: 'Specific objectives', description: 'Allowed number of specific objectives.', unit: 'objectives' },
            { key: 'expectedOutputs', label: 'Expected outputs', description: 'Allowed number of expected outputs.', unit: 'outputs' },
            { key: 'expectedOutputWords', label: 'Expected output words', description: 'Allowed number of words per expected output description.', unit: 'words' }
        ]
    },
    {
        title: 'Project budget & duration',
        subtitle: 'Overall financial ceiling and timeline boundaries for the project.',
        icon: 'pi pi-wallet',
        fields: [
            { key: 'budget', label: 'Project budget', description: 'Total overall project budget range.', unit: 'ETB', currency: true },
            { key: 'duration', label: 'Project duration', description: 'Total allowed project timeline duration.', unit: 'days' }
        ]
    },
    {
        title: 'Project structure & resources',
        subtitle: 'Participant limits, component breakdown, and overall item counts.',
        icon: 'pi pi-sitemap',
        fields: [
            { key: 'participants', label: 'Participants', description: 'Number of participants allowed in a project.', unit: 'people' },
            { key: 'phases', label: 'Number of phases', description: 'Allowed number of project phases.', unit: 'phases' },
            { key: 'activities', label: 'Activities', description: 'Allowed number of activities.', unit: 'activities' },
            { key: 'equipments', label: 'Equipments', description: 'Allowed number of equipment items.', unit: 'items' },
            { key: 'components', label: 'Components', description: 'Allowed number of project components.', unit: 'components' },
            { key: 'componentCollaborators', label: 'Component collaborators', description: 'Allowed number of contributors in a component.', unit: 'contributors' }
        ]
    },
    {
        title: 'Item-level financial & timeline limits',
        subtitle: 'Granular budget, cost, and duration constraints for phases, activities, and equipment.',
        icon: 'pi pi-sliders-h',
        fields: [
            { key: 'phaseBudget', label: 'Phase budget', description: 'Allowed budget for each individual phase.', unit: 'ETB', currency: true },
            { key: 'phaseDuration', label: 'Phase duration', description: 'Allowed duration for each individual phase.', unit: 'days' },
            { key: 'activityCost', label: 'Activity cost', description: 'Allowed cost for each individual activity.', unit: 'ETB', currency: true },
            { key: 'activityDuration', label: 'Activity duration', description: 'Allowed duration for each individual activity.', unit: 'days' },
            { key: 'equipmentCost', label: 'Equipment cost', description: 'Allowed cost for each equipment item.', unit: 'ETB', currency: true }
        ]
    },
    {
        title: 'Taxonomy & indicators',
        subtitle: 'Number of themes, sub-themes, focus areas and indicators.',
        icon: 'pi pi-tags',
        fields: [
            { key: 'themes', label: 'Themes', description: 'Allowed number of themes.', unit: 'themes' },
            { key: 'subThemes', label: 'Sub-themes', description: 'Allowed number of sub-themes.', unit: 'sub-themes' },
            { key: 'focusAreas', label: 'Focus areas', description: 'Allowed number of focus areas.', unit: 'areas' },
            { key: 'indicators', label: 'Indicators', description: 'Allowed number of indicators.', unit: 'indicators' }
        ]
    }
];

const emptyConstraint = (): Constraint => ({ name: '', description: '' });

/* ---------- Form ---------- */

const ConstraintForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Constraint>) => {
    const [localItem, setLocalItem] = useState<Constraint>(() =>
        item ? structuredClone(item) : emptyConstraint()
    );
    const [submitted, setSubmitted] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | number[]>([0, 2]);

    const nameMissing = !localItem.name?.trim();

    const updateField = <K extends keyof Constraint>(field: K, value: Constraint[K]) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
    };

    const updateRange = (
        key: RangeKey,
        bound: 'min' | 'max',
        value: number | null
    ) => {
        setLocalItem((prev) => {
            const updated = {
                ...(prev[key] ?? {}),
                [bound]: value ?? undefined
            } as Partial<IRange>;

            const next = { ...prev };

            if (updated.min === undefined && updated.max === undefined) {
                delete next[key];
            } else {
                next[key] = updated as IRange;
            }
            return next;
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing) return;

        await onSubmit({
            ...localItem,
            name: localItem.name.trim(),
            description: localItem.description?.trim() || undefined
        });
    };

    const renderRange = (field: RangeFieldConfig) => {
        const range = localItem[field.key];
        const id = `${formId}-${field.key}`;
        const currency = field.currency ?? false;

        const numberProps = {
            mode: currency ? ('currency' as const) : ('decimal' as const),
            currency: currency ? 'ETB' : undefined,
            locale: 'en-ET',
            minFractionDigits: currency ? 2 : 0,
            maxFractionDigits: 2,
            disabled: saving,
            className: 'w-full',
            inputClassName: 'w-full'
        };

        return (
            <div key={field.key} className="col-12 md:col-6">
                <div className="p-3 border-1 surface-border border-round-xl h-full surface-card shadow-sm hover:shadow-2 transition-all transition-duration-200">
                    <div className="flex align-items-start justify-content-between mb-3">
                        <div>
                            <div className="font-semibold text-900 text-base">{field.label}</div>
                            <small className="text-500 block mt-1 line-height-3">
                                {field.description}
                            </small>
                        </div>
                        <span className="text-xs px-2.5 py-1 border-round-pill surface-100 text-700 font-medium white-space-nowrap">
                            {field.unit}
                        </span>
                    </div>

                    <div className="grid formgroup-inline">
                        <div className="col-12 sm:col-6">
                            <label htmlFor={`${id}-min`} className="block text-xs font-semibold text-600 mb-1 uppercase tracking-wider">
                                Minimum
                            </label>
                            <InputNumber
                                {...numberProps}
                                inputId={`${id}-min`}
                                value={range?.min ?? null}
                                onValueChange={(e) => updateRange(field.key, 'min', e.value ?? null)}
                                placeholder="No minimum"
                            />
                        </div>

                        <div className="col-12 sm:col-6">
                            <label htmlFor={`${id}-max`} className="block text-xs font-semibold text-600 mb-1 uppercase tracking-wider">
                                Maximum
                            </label>
                            <InputNumber
                                {...numberProps}
                                inputId={`${id}-max`}
                                value={range?.max ?? null}
                                onValueChange={(e) => updateRange(field.key, 'max', e.value ?? null)}
                                placeholder="No maximum"
                            />
                        </div>
                    </div>

                    {!range && (
                        <div className="flex align-items-center gap-2 mt-3 text-xs text-400 font-italic">
                            <i className="pi pi-info-circle text-primary" />
                            <span>Leave empty to skip enforcing this constraint.</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {/* Name */}
            <div className="field mb-4">
                <label htmlFor="name" className="font-bold text-sm block mb-2 text-900">
                    Constraint name <span className="text-red-500">*</span>
                </label>

                <InputText
                    id="name"
                    value={localItem.name ?? ''}
                    disabled={saving}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. Standard Research Grant Limits"
                    className={classNames({ 'p-invalid': submitted && nameMissing }, 'w-full')}
                />

                {submitted && nameMissing && (
                    <small className="p-error block mt-1">Constraint name is required.</small>
                )}
            </div>

            {/* Description */}
            <div className="field mb-5">
                <label htmlFor="description" className="font-bold text-sm block mb-2 text-900">
                    Description
                </label>

                <InputTextarea
                    id="description"
                    value={localItem.description ?? ''}
                    disabled={saving}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    autoResize
                    placeholder="Describe when this constraint profile should be used (optional)"
                    className="w-full"
                />
            </div>

            {/* Range groups */}
            <div className="mb-3">
                <div className="font-bold text-base text-900 mb-1">Constraint Limits</div>
                <small className="text-500">
                    Configure thresholds for project parameters. Only specified limits are enforced.
                </small>
            </div>

            <Accordion
                multiple
                activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)}
                className="mt-2 border-round-xl overflow-hidden surface-border"
            >
                {SECTIONS.map((section) => (
                    <AccordionTab
                        key={section.title}
                        header={
                            <div className="flex align-items-center gap-3 py-1">
                                <div className="w-2.5rem h-2.5rem border-round-circle surface-primary flex align-items-center justify-content-center shadow-sm">
                                    <i className={`${section.icon} text-primary text-base`} />
                                </div>
                                <div>
                                    <div className="font-bold text-900 text-base">{section.title}</div>
                                    <small className="text-500 font-normal">{section.subtitle}</small>
                                </div>
                            </div>
                        }
                    >
                        <div className="grid pt-2">
                            {section.fields.map(renderRange)}
                        </div>
                    </AccordionTab>
                ))}
            </Accordion>
        </form>
    );
};

export default ConstraintForm;