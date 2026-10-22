'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';

import { EvaluationApi } from '@/app/(main)/evaluations/api/evaluation.api';
import {
    Evaluation,
    EvaluationStatus,
} from '@/app/(main)/evaluations/models/evaluation.model';

import { Call } from '@/app/(main)/calls/models/call.model';

import { TemplateApi } from '@/app/(main)/templates/api/template.api';
import { Template } from '@/app/(main)/templates/models/template.model';

import { ConstraintApi } from '@/app/(main)/constraints/api/constraint.api';
import { Constraint } from '@/app/(main)/constraints/models/constraint.model';

import { Stage } from '../models/stage.model';

const stageOptions = [
    { label: 'Concept Note', value: 'Concept Note' },
    { label: 'Proposal', value: 'Proposal' },
    { label: 'Manuscript', value: 'Manuscript' },
    { label: 'Eligibility Screening', value: 'Eligibility Screening' },
    { label: 'Peer Review', value: 'Peer Review' },
    { label: 'Verification & Audit', value: 'Verification & Audit' },
    { label: 'Final Selection', value: 'Final Selection' },
];

const extractId = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value;

    if (
        typeof value === 'object' &&
        value !== null &&
        '_id' in value &&
        typeof value._id === 'string'
    ) {
        return value._id;
    }

    return undefined;
};

const toDate = (value?: Date | string | null): Date | undefined => {
    if (!value) return undefined;

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : date;
};

export interface StageFormProps extends ItemFormRenderProps<Stage> {
    call?: Call;
}

const StageForm = ({
    item,
    saving,
    formId,
    onSubmit,
    call,
}: StageFormProps) => {
    const [localStage, setLocalStage] = useState<Partial<Stage>>({});
    const [submitted, setSubmitted] = useState(false);

    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [constraints, setConstraints] = useState<Constraint[]>([]);

    const activeCall = call ?? (typeof item?.call === 'object' ? item.call : undefined);
    const callDisplayTitle =
        activeCall?.title ??
        (typeof item?.call === 'string' ? item.call : '') ??
        (typeof call === 'string' ? call : '');

    const maxPossibleScore = useMemo(() => {
        const evaluation = localStage.evaluation as Evaluation | undefined;
        return evaluation?.weight ?? 100;
    }, [localStage.evaluation]);

    // Initialize/reset the form when the selected item or call changes.
    useEffect(() => {
        setSubmitted(false);

        setLocalStage({
            ...item,
            call: item?.call ?? call?._id ?? call ?? undefined,
            deadline: toDate(item?.deadline),
            minAcceptanceScore: item?.minAcceptanceScore ?? 0,
        });
    }, [item, call]);

    // Load supporting resources.
    useEffect(() => {
        let active = true;

        Promise.all([
            EvaluationApi.lookup!({ status: EvaluationStatus.published }),
            TemplateApi.lookup!(),
            ConstraintApi.lookup!(),
        ])
            .then(([evaluationData, templateData, constraintData]) => {
                if (!active) return;

                setEvaluations(evaluationData);
                setTemplates(templateData);
                setConstraints(constraintData);
            })
            .catch(console.error);

        return () => {
            active = false;
        };
    }, []);

    const updateStage = (changes: Partial<Stage>) => {
        setLocalStage((previous) => ({
            ...previous,
            ...changes,
        }));
    };

    const invalidScore =
        localStage.minAcceptanceScore == null ||
        localStage.minAcceptanceScore < 0 ||
        localStage.minAcceptanceScore > maxPossibleScore;

    const invalidReviewerCount =
        localStage.minReviewers == null ||
        localStage.maxReviewers == null ||
        localStage.minReviewers > localStage.maxReviewers;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        const resolvedCall = item?.call ?? call?._id ?? call;
        if (!resolvedCall) return;

        if (!localStage.name?.trim()) return;

        if (!localStage.deadline) return;

        if (localStage.minReviewers == null) return;

        if (localStage.maxReviewers == null) return;

        if (!localStage.evaluation) return;

        if (invalidScore) return;

        if (invalidReviewerCount) return;

        const payload = {
            ...localStage,
            name: localStage.name.trim(),
            call: extractId(resolvedCall) ?? resolvedCall,
            template: localStage.template
                ? extractId(localStage.template) ?? localStage.template
                : null,
            constraint: localStage.constraint
                ? extractId(localStage.constraint) ?? localStage.constraint
                : null,
            evaluation: extractId(localStage.evaluation) ?? localStage.evaluation,
        } as Stage;

        await onSubmit(payload);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid">
            <div className="card p-4 surface-card border-round shadow-1">
                {/* TOP SECTION: Call & Stage Name */}
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="stage-call" className="font-bold block mb-2">
                            Call <span className="p-error">*</span>
                        </label>
                        <InputText
                            id="stage-call"
                            value={callDisplayTitle}
                            disabled
                            className="bg-gray-100"
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="stage-name" className="font-bold block mb-2">
                            Stage Name <span className="p-error">*</span>
                        </label>
                        <Dropdown
                            inputId="stage-name"
                            value={localStage.name ?? ''}
                            options={stageOptions}
                            editable
                            placeholder="Select or enter a stage name"
                            onChange={(event) =>
                                updateStage({ name: event.value })
                            }
                            className={classNames({
                                'p-invalid': submitted && !localStage.name?.trim(),
                            })}
                        />
                        {submitted && !localStage.name?.trim() && (
                            <small className="p-error block mt-1">
                                Stage Name is required.
                            </small>
                        )}
                    </div>
                </div>

                {/* TOP SECTION: Deadline */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12">
                        <label htmlFor="stage-deadline" className="font-bold block mb-2">
                            Deadline <span className="p-error">*</span>
                        </label>
                        <Calendar
                            inputId="stage-deadline"
                            value={toDate(localStage.deadline)}
                            onChange={(event) =>
                                updateStage({
                                    deadline: event.value as Date | undefined,
                                })
                            }
                            showIcon
                            showTime
                            stepMinute={5}
                            hourFormat="12"
                            placeholder="Select Stage Deadline"
                            className={classNames({
                                'p-invalid': submitted && !localStage.deadline,
                            })}
                        />
                        {submitted && !localStage.deadline && (
                            <small className="p-error block mt-1">
                                Deadline is required.
                            </small>
                        )}
                    </div>
                </div>


                {/* MIDDLE SECTION: Evaluation & Min Acceptance Score */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="stage-evaluation" className="font-bold block mb-2">
                            Evaluation <span className="p-error">*</span>
                        </label>
                        <Dropdown
                            inputId="stage-evaluation"
                            value={extractId(localStage.evaluation) ?? null}
                            options={evaluations}
                            dataKey="_id"
                            optionLabel="title"
                            optionValue="_id"
                            placeholder="Select an Evaluation"
                            showClear
                            onChange={(event) => {
                                const selected = evaluations.find(
                                    (evaluation) =>
                                        evaluation._id === event.value
                                );

                                updateStage({
                                    evaluation: event.value ?? null,
                                    minAcceptanceScore:
                                        (localStage.minAcceptanceScore ?? 0) >
                                            (selected?.weight ?? 100)
                                            ? 0
                                            : localStage.minAcceptanceScore,
                                });
                            }}
                            className={classNames({
                                'p-invalid': submitted && !localStage.evaluation,
                            })}
                        />
                        {submitted && !localStage.evaluation && (
                            <small className="p-error block mt-1">
                                Evaluation is required.
                            </small>
                        )}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="stage-min-score" className="font-bold block mb-2">
                            Min Acceptance Score <span className="p-error">*</span>
                            {localStage.evaluation && ` (Max: ${maxPossibleScore})`}
                        </label>
                        <InputNumber
                            inputId="stage-min-score"
                            value={localStage.minAcceptanceScore ?? null}
                            min={0}
                            max={maxPossibleScore}
                            placeholder="Enter Min Acceptance Score"
                            onValueChange={(event) =>
                                updateStage({
                                    minAcceptanceScore: event.value ?? undefined,
                                })
                            }
                            className={classNames({
                                'p-invalid': submitted && invalidScore,
                            })}
                        />
                        {submitted && localStage.minAcceptanceScore == null && (
                            <small className="p-error block mt-1">
                                Min Acceptance Score is required.
                            </small>
                        )}
                        {submitted &&
                            localStage.minAcceptanceScore != null &&
                            (localStage.minAcceptanceScore < 0 ||
                                localStage.minAcceptanceScore > maxPossibleScore) && (
                                <small className="p-error block mt-1">
                                    Score must be between 0 and {maxPossibleScore}.
                                </small>
                            )}
                    </div>
                </div>

                {/* TOP SECTION: Reviewer Limits */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="stage-min-reviewers" className="font-bold block mb-2">
                            Min Reviewers <span className="p-error">*</span>
                        </label>
                        <InputNumber
                            inputId="stage-min-reviewers"
                            value={localStage.minReviewers ?? null}
                            min={0}
                            placeholder="Enter Min Reviewers"
                            onValueChange={(event) =>
                                updateStage({
                                    minReviewers: event.value ?? undefined,
                                })
                            }
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    (localStage.minReviewers == null || invalidReviewerCount),
                            })}
                        />
                        {submitted && localStage.minReviewers == null && (
                            <small className="p-error block mt-1">
                                Min Reviewers is required.
                            </small>
                        )}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="stage-max-reviewers" className="font-bold block mb-2">
                            Max Reviewers <span className="p-error">*</span>
                        </label>
                        <InputNumber
                            inputId="stage-max-reviewers"
                            value={localStage.maxReviewers ?? null}
                            min={0}
                            placeholder="Enter Max Reviewers"
                            onValueChange={(event) =>
                                updateStage({
                                    maxReviewers: event.value ?? undefined,
                                })
                            }
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    (localStage.maxReviewers == null || invalidReviewerCount),
                            })}
                        />
                        {submitted && localStage.maxReviewers == null && (
                            <small className="p-error block mt-1">
                                Max Reviewers is required.
                            </small>
                        )}
                    </div>
                </div>

                {submitted &&
                    localStage.minReviewers != null &&
                    localStage.maxReviewers != null &&
                    localStage.minReviewers > localStage.maxReviewers && (
                        <small className="p-error block mt-1">
                            Min Reviewers cannot exceed Max Reviewers.
                        </small>
                    )}


                {/* BOTTOM SECTION: Submission Template & Constraint Profile */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="stage-template" className="font-bold block mb-2">
                            Submission Template
                        </label>
                        <Dropdown
                            inputId="stage-template"
                            value={extractId(localStage.template) ?? null}
                            options={templates}
                            dataKey="_id"
                            optionLabel="name"
                            optionValue="_id"
                            placeholder="Select a Template (Optional)"
                            showClear
                            onChange={(event) =>
                                updateStage({ template: event.value ?? null })
                            }
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="stage-constraint" className="font-bold block mb-2">
                            Constraint Profile
                        </label>
                        <Dropdown
                            inputId="stage-constraint"
                            value={extractId(localStage.constraint) ?? null}
                            options={constraints}
                            optionLabel="name"
                            optionValue="_id"
                            placeholder="Select Constraint (Optional)"
                            showClear
                            onChange={(event) =>
                                updateStage({ constraint: event.value ?? null })
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Hidden submit button triggered by ItemManager dialog footer */}
            <button type="submit" hidden disabled={saving} />
        </form>
    );
};

export default StageForm;