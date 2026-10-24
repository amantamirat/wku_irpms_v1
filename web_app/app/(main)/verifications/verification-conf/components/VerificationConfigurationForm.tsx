'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { useAuth } from '@/contexts/auth-context';

import { EvaluationApi } from '@/app/(main)/evaluations/api/evaluation.api';
import {
    Evaluation,
    EvaluationStatus,
} from '@/app/(main)/evaluations/models/evaluation.model';

import { Grant } from '../../../grants/models/grant.model';
import { GrantApi } from '../../../grants/api/grant.api';

import { TemplateApi } from '@/app/(main)/templates/api/template.api';
import { Template } from '@/app/(main)/templates/models/template.model';

import { VerificationConfiguration } from '../models/verification-conf.model';

const toDate = (value?: Date | string | null): Date | undefined => {
    if (!value) return undefined;

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : date;
};

// Returns the full object: as-is if already an object, or looked up by id.
const resolveOption = <T extends { _id?: string }>(
    value: unknown,
    options: T[]
): T | null => {
    if (!value) return null;
    if (typeof value === 'object') return value as T;

    return options.find((option) => option._id === value) ?? null;
};

export interface VerificationConfigurationFormProps
    extends ItemFormRenderProps<VerificationConfiguration> {
    grant?: Grant;
}

const VerificationConfigurationForm = ({
    item,
    saving,
    formId,
    onSubmit,
    grant,
}: VerificationConfigurationFormProps) => {
    const { hasPermission } = useAuth();

    const [localConfig, setLocalConfig] = useState<Partial<VerificationConfiguration>>({});
    const [submitted, setSubmitted] = useState(false);

    const [grants, setGrants] = useState<Grant[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    const isGrantPredefined = !!item?.grant || !!grant;
    const activeGrant =
        grant ?? (typeof item?.grant === 'object' ? item.grant : undefined);
    const grantDisplayTitle =
        activeGrant?.title ??
        (typeof item?.grant === 'string' ? item.grant : '');

    // Selected objects resolved against the loaded lists
    const selectedGrant = resolveOption<Grant>(localConfig.grant, grants);
    const selectedEvaluation = resolveOption<Evaluation>(
        localConfig.evaluation,
        evaluations
    );
    const selectedTemplate = resolveOption<Template>(
        localConfig.template,
        templates
    );

    const maxPossibleScore = useMemo(
        () => selectedEvaluation?.weight ?? 100,
        [selectedEvaluation]
    );

    // Load supporting resources with permission validation
    useEffect(() => {
        let active = true;

        if (!isGrantPredefined) {
            if (hasPermission && !hasPermission('grant:lookup')) {
                console.warn('User does not have permission to lookup grants.');
            } else {
                GrantApi.lookup!()
                    .then((data) => {
                        if (active) setGrants(data);
                    })
                    .catch(console.error);
            }
        }

        if (hasPermission && !hasPermission('template:lookup')) {
            console.warn('User does not have permission to lookup templates.');
        } else {
            TemplateApi.lookup!()
                .then((data) => {
                    if (active) setTemplates(data);
                })
                .catch(console.error);
        }

        if (hasPermission && !hasPermission('evaluation:lookup')) {
            console.warn('User does not have permission to lookup evaluations.');
        } else {
            EvaluationApi.lookup!({ status: EvaluationStatus.published })
                .then((data) => {
                    if (active) setEvaluations(data);
                })
                .catch(console.error);
        }

        return () => {
            active = false;
        };
    }, [isGrantPredefined, hasPermission]);

    // Initialize/reset form state
    useEffect(() => {
        setSubmitted(false);

        setLocalConfig({
            ...item,
            grant: item?.grant ?? grant ?? undefined,
            deadline: toDate(item?.deadline),
            minAcceptanceScore: item?.minAcceptanceScore ?? 0,
            minReviewers: item?.minReviewers ?? 1,
            maxReviewers: item?.maxReviewers ?? 1,
            maxAttempts: item?.maxAttempts ?? 1,
        });
    }, [item, grant]);

    const updateConfig = (changes: Partial<VerificationConfiguration>) => {
        setLocalConfig((previous) => ({
            ...previous,
            ...changes,
        }));
    };

    const invalidScore =
        localConfig.minAcceptanceScore == null ||
        localConfig.minAcceptanceScore < 0 ||
        localConfig.minAcceptanceScore > maxPossibleScore;

    const invalidReviewerCount =
        localConfig.minReviewers == null ||
        localConfig.maxReviewers == null ||
        localConfig.minReviewers < 1 ||
        localConfig.minReviewers > localConfig.maxReviewers;

    const invalidAttempts =
        localConfig.maxAttempts == null || localConfig.maxAttempts < 1;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        if (!localConfig.grant) return;
        if (!localConfig.deadline) return;
        if (!localConfig.evaluation) return;
        if (invalidScore) return;
        if (invalidReviewerCount) return;
        if (invalidAttempts) return;

        const payload = {
            ...localConfig,
            grant: selectedGrant ?? localConfig.grant,
            evaluation: selectedEvaluation ?? localConfig.evaluation,
            template: selectedTemplate ?? null,
        } as VerificationConfiguration;

        await onSubmit(payload);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            <div className="card p-4 surface-card border-round shadow-1">
                {/* ROW 1: Grant & Deadline */}
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="config-grant" className="font-bold block mb-2">
                            Grant <span className="p-error">*</span>
                        </label>
                        {isGrantPredefined ? (
                            <InputText
                                id="config-grant"
                                value={grantDisplayTitle}
                                disabled
                                className="bg-gray-100"
                            />
                        ) : (
                            <Dropdown
                                inputId="config-grant"
                                value={selectedGrant}
                                options={grants}
                                dataKey="_id"
                                optionLabel="title"
                                placeholder="Select a Grant"
                                onChange={(event) =>
                                    updateConfig({
                                        grant: (event.value ??
                                            undefined) as VerificationConfiguration['grant'],
                                    })
                                }
                                className={classNames({
                                    'p-invalid': submitted && !localConfig.grant,
                                })}
                            />
                        )}
                        {submitted && !localConfig.grant && (
                            <small className="p-error block mt-1">
                                Grant is required.
                            </small>
                        )}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="config-deadline" className="font-bold block mb-2">
                            Deadline <span className="p-error">*</span>
                        </label>
                        <Calendar
                            inputId="config-deadline"
                            value={toDate(localConfig.deadline)}
                            onChange={(event) =>
                                updateConfig({
                                    deadline: event.value as Date | undefined,
                                })
                            }
                            showIcon
                            showTime
                            stepMinute={5}
                            hourFormat="12"
                            placeholder="Select Deadline"
                            className={classNames({
                                'p-invalid': submitted && !localConfig.deadline,
                            })}
                        />
                        {submitted && !localConfig.deadline && (
                            <small className="p-error block mt-1">
                                Deadline is required.
                            </small>
                        )}
                    </div>
                </div>

                {/* ROW 2: Evaluation & Min Acceptance Score */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="config-evaluation" className="font-bold block mb-2">
                            Evaluation <span className="p-error">*</span>
                        </label>
                        <Dropdown
                            inputId="config-evaluation"
                            value={selectedEvaluation}
                            options={evaluations}
                            dataKey="_id"
                            optionLabel="title"
                            placeholder="Select an Evaluation"
                            showClear
                            onChange={(event) => {
                                const selected = event.value as Evaluation | null;

                                updateConfig({
                                    evaluation: (selected ??
                                        undefined) as VerificationConfiguration['evaluation'],
                                    minAcceptanceScore:
                                        (localConfig.minAcceptanceScore ?? 0) >
                                        (selected?.weight ?? 100)
                                            ? 0
                                            : localConfig.minAcceptanceScore,
                                });
                            }}
                            className={classNames({
                                'p-invalid': submitted && !localConfig.evaluation,
                            })}
                        />
                        {submitted && !localConfig.evaluation && (
                            <small className="p-error block mt-1">
                                Evaluation is required.
                            </small>
                        )}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="config-min-score" className="font-bold block mb-2">
                            Min Acceptance Score <span className="p-error">*</span>
                            {localConfig.evaluation && ` (Max: ${maxPossibleScore})`}
                        </label>
                        <InputNumber
                            inputId="config-min-score"
                            value={localConfig.minAcceptanceScore ?? null}
                            min={0}
                            max={maxPossibleScore}
                            placeholder="Enter Min Acceptance Score"
                            onValueChange={(event) =>
                                updateConfig({
                                    minAcceptanceScore: event.value ?? undefined,
                                })
                            }
                            className={classNames({
                                'p-invalid': submitted && invalidScore,
                            })}
                        />
                        {submitted && localConfig.minAcceptanceScore == null && (
                            <small className="p-error block mt-1">
                                Min Acceptance Score is required.
                            </small>
                        )}
                        {submitted &&
                            localConfig.minAcceptanceScore != null &&
                            (localConfig.minAcceptanceScore < 0 ||
                                localConfig.minAcceptanceScore > maxPossibleScore) && (
                                <small className="p-error block mt-1">
                                    Score must be between 0 and {maxPossibleScore}.
                                </small>
                            )}
                    </div>
                </div>

                {/* ROW 3: Min Reviewers & Max Reviewers */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="config-min-reviewers" className="font-bold block mb-2">
                            Min Reviewers <span className="p-error">*</span>
                        </label>
                        <InputNumber
                            inputId="config-min-reviewers"
                            value={localConfig.minReviewers ?? null}
                            min={1}
                            placeholder="Min Reviewers"
                            onValueChange={(event) =>
                                updateConfig({
                                    minReviewers: event.value ?? undefined,
                                })
                            }
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    (localConfig.minReviewers == null ||
                                        localConfig.minReviewers < 1),
                            })}
                        />
                        {submitted &&
                            (localConfig.minReviewers == null ||
                                localConfig.minReviewers < 1) && (
                                <small className="p-error block mt-1">
                                    Must be at least 1.
                                </small>
                            )}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="config-max-reviewers" className="font-bold block mb-2">
                            Max Reviewers <span className="p-error">*</span>
                        </label>
                        <InputNumber
                            inputId="config-max-reviewers"
                            value={localConfig.maxReviewers ?? null}
                            min={localConfig.minReviewers || 1}
                            placeholder="Max Reviewers"
                            onValueChange={(event) =>
                                updateConfig({
                                    maxReviewers: event.value ?? undefined,
                                })
                            }
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    (localConfig.maxReviewers == null ||
                                        localConfig.maxReviewers <
                                            (localConfig.minReviewers || 1)),
                            })}
                        />
                        {submitted &&
                            (localConfig.maxReviewers == null ||
                                localConfig.maxReviewers <
                                    (localConfig.minReviewers || 1)) && (
                                <small className="p-error block mt-1">
                                    Must be ≥ Min Reviewers.
                                </small>
                            )}
                    </div>
                </div>

                {/* ROW 4: Template & Max Attempts */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="config-template" className="font-bold block mb-2">
                            Template
                        </label>
                        <Dropdown
                            inputId="config-template"
                            value={selectedTemplate}
                            options={templates}
                            dataKey="_id"
                            optionLabel="name"
                            placeholder="Select a Template (Optional)"
                            showClear
                            onChange={(event) =>
                                updateConfig({
                                    template: (event.value ??
                                        undefined) as VerificationConfiguration['template'],
                                })
                            }
                        />
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="config-max-attempts" className="font-bold block mb-2">
                            Max Attempts <span className="p-error">*</span>
                        </label>
                        <InputNumber
                            inputId="config-max-attempts"
                            value={localConfig.maxAttempts ?? null}
                            min={1}
                            placeholder="Max Attempts"
                            onValueChange={(event) =>
                                updateConfig({
                                    maxAttempts: event.value ?? undefined,
                                })
                            }
                            className={classNames({
                                'p-invalid': submitted && invalidAttempts,
                            })}
                        />
                        {submitted && invalidAttempts && (
                            <small className="p-error block mt-1">
                                Must be at least 1.
                            </small>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
};

export default VerificationConfigurationForm;