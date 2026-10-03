'use client';

import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { classNames } from 'primereact/utils';

import { ConstraintApi } from '../api/constraint.api';
import {
    Constraint,
    validateConstraint,
} from '../models/constraint.model';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { IRange } from '@/types/range';


/**
 * Initialize constraint state
 */
const initializeConstraint = (
    item?: Partial<Constraint>
): Constraint => ({
    _id: item?._id,

    name: item?.name ?? '',
    description: item?.description ?? '',

    titleWords: item?.titleWords
        ? { ...item.titleWords }
        : undefined,

    summaryWords: item?.summaryWords
        ? { ...item.summaryWords }
        : undefined,

    participants: item?.participants
        ? { ...item.participants }
        : undefined,

    phases: item?.phases
        ? { ...item.phases }
        : undefined,

    budget: item?.budget
        ? { ...item.budget }
        : undefined,

    duration: item?.duration
        ? { ...item.duration }
        : undefined,

    budgetPerPhase: item?.budgetPerPhase
        ? { ...item.budgetPerPhase }
        : undefined,

    durationPerPhase: item?.durationPerPhase
        ? { ...item.durationPerPhase }
        : undefined,

    activitiesPerPhase: item?.activitiesPerPhase
        ? { ...item.activitiesPerPhase }
        : undefined,

    equipmentsPerPhase: item?.equipmentsPerPhase
        ? { ...item.equipmentsPerPhase }
        : undefined,

    themes: item?.themes
        ? { ...item.themes }
        : undefined,

    subThemes: item?.subThemes
        ? { ...item.subThemes }
        : undefined,

    focusAreas: item?.focusAreas
        ? { ...item.focusAreas }
        : undefined,

    indicators: item?.indicators
        ? { ...item.indicators }
        : undefined,

    createdAt: item?.createdAt,
    updatedAt: item?.updatedAt,
});


const SaveConstraint = ({
    visible,
    item,
    onComplete,
    onHide,
}: EntitySaveDialogProps<Constraint>) => {

    const [localConstraint, setLocalConstraint] =
        useState<Constraint>(() => initializeConstraint(item));

    const [submitted, setSubmitted] = useState(false);

    const toast = useRef<Toast>(null);


    /**
     * Reset form when item changes
     */
    useEffect(() => {
        setLocalConstraint(initializeConstraint(item));
        setSubmitted(false);
    }, [item]);


    /**
     * Update normal field
     */
    const updateField = (
        field: keyof Constraint,
        value: any
    ) => {
        setLocalConstraint((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    /**
     * Update range field
     */
    const updateRangeField = (
        rangeKey: keyof Constraint,
        bound: 'min' | 'max',
        value: number | null | undefined
    ) => {
        setLocalConstraint((prev) => {
            const currentRange =
                prev[rangeKey] as IRange | undefined;

            const updatedRange: Partial<IRange> = {
                ...(currentRange ?? {}),
                [bound]: value ?? undefined,
            };

            if (
                updatedRange.min === undefined &&
                updatedRange.max === undefined
            ) {
                const copy = { ...prev };
                delete copy[rangeKey];
                return copy;
            }

            return {
                ...prev,
                [rangeKey]: updatedRange as IRange,
            };
        });
    };


    /**
     * Save
     */
    const saveConstraint = async () => {

        setSubmitted(true);

        try {

            const validation =
                validateConstraint(localConstraint);

            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const saved = localConstraint._id
                ? await ConstraintApi.update(localConstraint)
                : await ConstraintApi.create(localConstraint);

            toast.current?.show({
                severity: 'success',
                summary: 'Saved',
                detail: 'Constraint profile saved successfully.',
                life: 1500,
            });

            if (onComplete) {
                setTimeout(() => {
                    onComplete(saved);
                }, 700);
            }

        } catch (err: any) {

            toast.current?.show({
                severity: 'error',
                summary: 'Unable to save',
                detail:
                    err?.message ||
                    'Failed to save constraint profile.',
                life: 3000,
            });

        } finally {
            setSubmitted(false);
        }
    };


    /**
     * Close dialog
     */
    const hide = () => {
        setSubmitted(false);
        onHide();
    };


    /**
     * Range input
     */
    const renderRangeInputs = (
        label: string,
        rangeKey: keyof Constraint,
        options?: {
            description?: string;
            unit?: string;
            currency?: boolean;
        }
    ) => {

        const range =
            localConstraint[rangeKey] as IRange | undefined;

        const currency = options?.currency ?? false;

        return (
            <div className="col-12 md:col-6">

                <div
                    className="
                        p-3
                        border-1
                        surface-border
                        border-round
                        h-full
                        surface-card
                    "
                >

                    {/* Label */}
                    <div className="flex align-items-start justify-content-between mb-3">

                        <div>
                            <div className="font-semibold text-900">
                                {label}
                            </div>

                            {options?.description && (
                                <small className="text-500 block mt-1 line-height-3">
                                    {options.description}
                                </small>
                            )}
                        </div>

                        {options?.unit && (
                            <span
                                className="
                                    text-xs
                                    px-2
                                    py-1
                                    border-round
                                    surface-100
                                    text-600
                                    white-space-nowrap
                                "
                            >
                                {options.unit}
                            </span>
                        )}

                    </div>


                    {/* Inputs */}
                    <div className="grid">

                        <div className="col-12 sm:col-6">

                            <label
                                htmlFor={`${String(rangeKey)}-min`}
                                className="block text-sm text-600 mb-2"
                            >
                                Minimum
                            </label>

                            <InputNumber
                                id={`${String(rangeKey)}-min`}
                                value={range?.min ?? null}
                                onValueChange={(e) =>
                                    updateRangeField(
                                        rangeKey,
                                        'min',
                                        e.value
                                    )
                                }
                                placeholder="No minimum"
                                mode={
                                    currency
                                        ? 'currency'
                                        : 'decimal'
                                }
                                currency={
                                    currency
                                        ? 'ETB'
                                        : undefined
                                }
                                locale="en-ET"
                                minFractionDigits={
                                    currency ? 2 : 0
                                }
                                maxFractionDigits={
                                    currency ? 2 : 2
                                }
                                className="w-full"
                                inputClassName="w-full"
                            />

                        </div>


                        <div className="col-12 sm:col-6">

                            <label
                                htmlFor={`${String(rangeKey)}-max`}
                                className="block text-sm text-600 mb-2"
                            >
                                Maximum
                            </label>

                            <InputNumber
                                id={`${String(rangeKey)}-max`}
                                value={range?.max ?? null}
                                onValueChange={(e) =>
                                    updateRangeField(
                                        rangeKey,
                                        'max',
                                        e.value
                                    )
                                }
                                placeholder="No maximum"
                                mode={
                                    currency
                                        ? 'currency'
                                        : 'decimal'
                                }
                                currency={
                                    currency
                                        ? 'ETB'
                                        : undefined
                                }
                                locale="en-ET"
                                minFractionDigits={
                                    currency ? 2 : 0
                                }
                                maxFractionDigits={
                                    currency ? 2 : 2
                                }
                                className="w-full"
                                inputClassName="w-full"
                            />

                        </div>

                    </div>

                    {/* Empty state */}
                    {!range && (
                        <div
                            className="
                                flex
                                align-items-center
                                gap-2
                                mt-2
                                text-sm
                                text-500
                            "
                        >
                            <i className="pi pi-info-circle" />
                            <span>
                                Leave both fields empty to skip this constraint.
                            </span>
                        </div>
                    )}

                </div>

            </div>
        );
    };


    /**
     * Dialog footer
     */
    const footer = (
        <div
            className="
                flex
                flex-column
                sm:flex-row
                justify-content-between
                align-items-stretch
                sm:align-items-center
                gap-2
            "
        >

            <small className="text-500">
                <i className="pi pi-info-circle mr-1" />
                Only configured limits will be enforced.
            </small>

            <div className="flex justify-content-end gap-2">

                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    severity="secondary"
                    outlined
                    onClick={hide}
                    disabled={submitted}
                />

                <Button
                    label={
                        localConstraint._id
                            ? 'Save Changes'
                            : 'Create Constraint'
                    }
                    icon="pi pi-check"
                    onClick={saveConstraint}
                    loading={submitted}
                />

            </div>

        </div>
    );


    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                onHide={hide}
                modal
                maximizable
                draggable={false}
                className="p-fluid"
                style={{
                    width: 'min(960px, 95vw)',
                }}
                contentStyle={{
                    padding: 0,
                }}
                header={
                    <div className="flex align-items-center gap-3">

                        <div
                            className="
                                flex
                                align-items-center
                                justify-content-center
                                border-round
                                bg-primary
                                text-white
                            "
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                            }}
                        >
                            <i className="pi pi-sliders-h text-lg" />
                        </div>

                        <div>
                            <div className="text-xl font-semibold text-900">
                                {localConstraint._id
                                    ? 'Edit Constraint'
                                    : 'New Constraint'}
                            </div>

                            <small className="text-500">
                                Define limits and requirements for projects.
                            </small>
                        </div>

                    </div>
                }
                footer={footer}
            >

                <div className="p-3 md:p-4">

                    {/* =====================================================
                        BASIC INFORMATION
                    ===================================================== */}

                    <div className="mb-4">

                        <div className="flex align-items-center gap-2 mb-3">

                            <i className="pi pi-info-circle text-primary" />

                            <div>
                                <div className="font-semibold text-900">
                                    Basic information
                                </div>

                                <small className="text-500">
                                    Give this constraint profile a name and
                                    optional description.
                                </small>
                            </div>

                        </div>


                        <div className="grid">

                            <div className="col-12">

                                <label
                                    htmlFor="name"
                                    className="block font-medium text-900 mb-2"
                                >
                                    Constraint name
                                    <span className="text-red-500 ml-1">
                                        *
                                    </span>
                                </label>

                                <InputText
                                    id="name"
                                    value={
                                        localConstraint.name || ''
                                    }
                                    onChange={(e) =>
                                        updateField(
                                            'name',
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Standard Research Grant Limits"
                                    className={classNames({
                                        'p-invalid':
                                            submitted &&
                                            !localConstraint.name?.trim(),
                                    })}
                                />

                                {submitted &&
                                    !localConstraint.name?.trim() && (
                                        <small className="p-error block mt-1">
                                            Constraint name is required.
                                        </small>
                                    )}

                            </div>


                            <div className="col-12">

                                <label
                                    htmlFor="description"
                                    className="block font-medium text-900 mb-2"
                                >
                                    Description
                                </label>

                                <InputTextarea
                                    id="description"
                                    value={
                                        localConstraint.description || ''
                                    }
                                    onChange={(e) =>
                                        updateField(
                                            'description',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Describe when this constraint profile should be used..."
                                    rows={3}
                                    autoResize
                                />

                            </div>

                        </div>

                    </div>


                    {/* =====================================================
                        CONSTRAINT GROUPS
                    ===================================================== */}

                    <Accordion
                        multiple
                        activeIndex={[0]}
                    >

                        {/* CONTENT */}

                        <AccordionTab
                            header={
                                <div className="flex align-items-center gap-3">

                                    <i className="pi pi-file-edit text-primary" />

                                    <div>
                                        <div className="font-semibold">
                                            Content limits
                                        </div>

                                        <small className="text-500">
                                            Control the size of project
                                            titles and summaries.
                                        </small>
                                    </div>

                                </div>
                            }
                        >

                            <div className="grid pt-2">

                                {renderRangeInputs(
                                    'Title words',
                                    'titleWords',
                                    {
                                        description:
                                            'Allowed number of words in the project title.',
                                        unit: 'words',
                                    }
                                )}

                                {renderRangeInputs(
                                    'Summary words',
                                    'summaryWords',
                                    {
                                        description:
                                            'Allowed number of words in the project summary.',
                                        unit: 'words',
                                    }
                                )}

                            </div>

                        </AccordionTab>


                        {/* PROJECT STRUCTURE */}

                        <AccordionTab
                            header={
                                <div className="flex align-items-center gap-3">

                                    <i className="pi pi-sitemap text-primary" />

                                    <div>
                                        <div className="font-semibold">
                                            Project structure
                                        </div>

                                        <small className="text-500">
                                            Define project size, participants,
                                            phases and resources.
                                        </small>
                                    </div>

                                </div>
                            }
                        >

                            <div className="grid pt-2">

                                {renderRangeInputs(
                                    'Participants',
                                    'participants',
                                    {
                                        description:
                                            'Number of participants allowed in a project.',
                                        unit: 'people',
                                    }
                                )}

                                {renderRangeInputs(
                                    'Number of phases',
                                    'phases',
                                    {
                                        description:
                                            'Allowed number of project phases.',
                                        unit: 'phases',
                                    }
                                )}

                                {renderRangeInputs(
                                    'Project budget',
                                    'budget',
                                    {
                                        description:
                                            'Total project budget range.',
                                        unit: 'ETB',
                                        currency: true,
                                    }
                                )}

                                {renderRangeInputs(
                                    'Project duration',
                                    'duration',
                                    {
                                        description:
                                            'Allowed project duration.',
                                        unit: 'days',
                                    }
                                )}

                            </div>

                        </AccordionTab>


                        {/* PHASE LIMITS */}

                        <AccordionTab
                            header={
                                <div className="flex align-items-center gap-3">

                                    <i className="pi pi-calendar text-primary" />

                                    <div>
                                        <div className="font-semibold">
                                            Phase limits
                                        </div>

                                        <small className="text-500">
                                            Set limits for individual phases
                                            within a project.
                                        </small>
                                    </div>

                                </div>
                            }
                        >

                            <div className="grid pt-2">

                                {renderRangeInputs(
                                    'Budget per phase',
                                    'budgetPerPhase',
                                    {
                                        description:
                                            'Maximum or minimum budget for each phase.',
                                        unit: 'ETB',
                                        currency: true,
                                    }
                                )}

                                {renderRangeInputs(
                                    'Duration per phase',
                                    'durationPerPhase',
                                    {
                                        description:
                                            'Allowed duration for each phase.',
                                        unit: 'days',
                                    }
                                )}

                                {renderRangeInputs(
                                    'Activities per phase',
                                    'activitiesPerPhase',
                                    {
                                        description:
                                            'Number of activities allowed in each phase.',
                                        unit: 'activities',
                                    }
                                )}

                                {renderRangeInputs(
                                    'Equipment per phase',
                                    'equipmentsPerPhase',
                                    {
                                        description:
                                            'Number of equipment items allowed in each phase.',
                                        unit: 'items',
                                    }
                                )}

                            </div>

                        </AccordionTab>


                        {/* TAXONOMY */}

                        <AccordionTab
                            header={
                                <div className="flex align-items-center gap-3">

                                    <i className="pi pi-tags text-primary" />

                                    <div>
                                        <div className="font-semibold">
                                            Taxonomy & indicators
                                        </div>

                                        <small className="text-500">
                                            Control the number of themes,
                                            focus areas and indicators.
                                        </small>
                                    </div>

                                </div>
                            }
                        >

                            <div className="grid pt-2">

                                {renderRangeInputs(
                                    'Themes',
                                    'themes',
                                    {
                                        description:
                                            'Allowed number of themes.',
                                        unit: 'themes',
                                    }
                                )}

                                {renderRangeInputs(
                                    'Sub-themes',
                                    'subThemes',
                                    {
                                        description:
                                            'Allowed number of sub-themes.',
                                        unit: 'sub-themes',
                                    }
                                )}

                                {renderRangeInputs(
                                    'Focus areas',
                                    'focusAreas',
                                    {
                                        description:
                                            'Allowed number of focus areas.',
                                        unit: 'areas',
                                    }
                                )}

                                {renderRangeInputs(
                                    'Indicators',
                                    'indicators',
                                    {
                                        description:
                                            'Allowed number of indicators.',
                                        unit: 'indicators',
                                    }
                                )}

                            </div>

                        </AccordionTab>

                    </Accordion>

                </div>

            </Dialog>
        </>
    );
};


export default SaveConstraint;