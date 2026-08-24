'use client';

import { EvaluationApi } from '@/app/(main)/evaluations/api/evaluation.api';
import { Evaluation } from '@/app/(main)/evaluations/models/evaluation.model';
import { EvaluationStatus } from '@/app/(main)/evaluations/models/evaluation.state-machine';
import { TemplateApi } from '@/app/(main)/templates/api/template.api';
import { Template } from '@/app/(main)/templates/models/template.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GrantApi } from '../../../grants/api/grant.api';
import { Grant } from '../../../grants/models/grant.model';
import { VerificationConfigurationApi } from '../api/verification-conf.api';
import { VerificationConfiguration, validateVerificationConfiguration } from '../models/verification-conf.model';

const SaveVerificationConfiguration = ({
    visible,
    item,
    onComplete,
    onHide,
}: EntitySaveDialogProps<VerificationConfiguration>) => {
    const toast = useRef<Toast>(null);

    const [localConfig, setLocalConfig] = useState<Partial<VerificationConfiguration>>({
        ...item,
        deadline: item?.deadline ? new Date(item.deadline) : undefined,
    });

    const [submitted, setSubmitted] = useState(false);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    const isGrantPredefined = !!item?.grant;

    // Helper to extract the max score from the selected evaluation
    const maxPossibleScore = useMemo(() => {
        const evalObj = localConfig.evaluation as Evaluation;
        return evalObj?.weight ?? 100;
    }, [localConfig.evaluation]);

    // Fetch Grants, Templates, and Evaluations for dropdown options
    useEffect(() => {
        if (!isGrantPredefined) {
            GrantApi.getAll().then(setGrants).catch(console.error);
        }

        TemplateApi.getAll().then(setTemplates).catch(console.error);

        EvaluationApi.getAll({ status: EvaluationStatus.published })
            .then(setEvaluations)
            .catch(console.error);
    }, [isGrantPredefined]);

    // Sync local state and resolve string IDs to objects once lists load
    useEffect(() => {
        if (!item) return;

        // Resolve evaluation string ID to object if evaluations are loaded
        let resolvedEvaluation = item.evaluation;
        if (resolvedEvaluation && typeof resolvedEvaluation === 'string' && evaluations.length > 0) {
            resolvedEvaluation = evaluations.find((e) => e._id === resolvedEvaluation) || resolvedEvaluation;
        }

        // Resolve template string ID to object if templates are loaded
        let resolvedTemplate = item.template;
        if (resolvedTemplate && typeof resolvedTemplate === 'string' && templates.length > 0) {
            resolvedTemplate = templates.find((t) => t._id === resolvedTemplate) || resolvedTemplate;
        }

        setLocalConfig({
            ...item,
            evaluation: resolvedEvaluation,
            template: resolvedTemplate,
            deadline: item.deadline ? new Date(item.deadline) : undefined,
        });
    }, [item, evaluations, templates]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalConfig({
            ...item,
            deadline: undefined,
        });
    };

    const saveConfiguration = async () => {
        try {
            setSubmitted(true);

            // Min Acceptance Score Validation
            if ((localConfig.minAcceptanceScore ?? 0) > maxPossibleScore) {
                throw new Error(`Min Acceptance Score cannot exceed Evaluation weight (${maxPossibleScore})`);
            }

            const validation = validateVerificationConfiguration(localConfig);
            if (!validation.valid) {
                throw new Error(validation.message || 'Validation error');
            }

            let saved: VerificationConfiguration;
            if (localConfig._id) {
                saved = await VerificationConfigurationApi.update(
                    localConfig as VerificationConfiguration
                );
            } else {
                saved = await VerificationConfigurationApi.create(
                    localConfig as VerificationConfiguration
                );
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Verification Configuration saved successfully',
                life: 2000,
            });

            onComplete?.({
                ...saved,
                evaluation: localConfig.evaluation,
                template: localConfig.template,
            });
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Verification Configuration',
                life: 3000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" onClick={saveConfiguration} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={
                    localConfig._id
                        ? 'Edit Verification Configuration'
                        : 'New Verification Configuration'
                }
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {/* Grant Selection */}
                <div className="field">
                    <label className="font-bold">Grant</label>
                    {isGrantPredefined ? (
                        <InputText
                            value={
                                (localConfig.grant as Grant)?.title ||
                                (localConfig.grant as string)
                            }
                            disabled
                        />
                    ) : (
                        <Dropdown
                            value={localConfig.grant}
                            dataKey="_id"
                            options={grants}
                            optionLabel="title"
                            optionValue="_id"
                            placeholder="Select a Grant"
                            onChange={(e) =>
                                setLocalConfig((p) => ({ ...p, grant: e.value }))
                            }
                            className={classNames({
                                'p-invalid': submitted && !localConfig.grant,
                            })}
                        />
                    )}
                    {submitted && !localConfig.grant && (
                        <small className="p-error">Grant is required.</small>
                    )}
                </div>

                {/* Deadline */}
                <div className="field">
                    <label className="font-bold">Deadline</label>
                    <Calendar
                        value={
                            localConfig.deadline
                                ? new Date(localConfig.deadline)
                                : undefined
                        }
                        onChange={(e) =>
                            setLocalConfig((p) => ({
                                ...p,
                                deadline: e.value as Date,
                            }))
                        }
                        showIcon
                        placeholder="Select Deadline"
                        showTime
                        stepMinute={5}
                        hourFormat="12"
                        className={classNames({
                            'p-invalid': submitted && !localConfig.deadline,
                        })}
                    />
                    {submitted && !localConfig.deadline && (
                        <small className="p-error">Deadline is required.</small>
                    )}
                </div>

                {/* Evaluation Selection */}
                <div className="field">
                    <label className="font-bold">Evaluation</label>
                    <Dropdown
                        value={localConfig.evaluation}
                        dataKey="_id"
                        options={evaluations}
                        optionLabel="title"
                        placeholder="Select an Evaluation"
                        showClear
                        className={classNames({
                            'p-invalid': submitted && !localConfig.evaluation,
                        })}
                        onChange={(e) => {
                            setLocalConfig((p) => ({
                                ...p,
                                evaluation: e.value,
                                minAcceptanceScore:
                                    (p.minAcceptanceScore ?? 0) > (e.value?.weight || 100)
                                        ? 0
                                        : p.minAcceptanceScore,
                            }));
                        }}
                    />
                    {submitted && !localConfig.evaluation && (
                        <small className="p-error">Evaluation is required.</small>
                    )}
                </div>

                {/* Template Selection */}
                <div className="field">
                    <label className="font-bold">Template</label>
                    <Dropdown
                        value={localConfig.template}
                        dataKey="_id"
                        options={templates}
                        optionLabel="name"
                        placeholder="Select a Template (Optional)"
                        showClear
                        onChange={(e) =>
                            setLocalConfig((p) => ({ ...p, template: e.value }))
                        }
                    />
                </div>

                {/* Min / Max Reviewers */}
                <div className="formgrid grid">
                    <div className="field col">
                        <label className="font-bold">Min Reviewers</label>
                        <InputNumber
                            value={localConfig.minReviewers}
                            onValueChange={(e) =>
                                setLocalConfig((p) => ({
                                    ...p,
                                    minReviewers: e.value ?? 1,
                                }))
                            }
                            min={1}
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    (localConfig.minReviewers === undefined ||
                                        localConfig.minReviewers < 1),
                            })}
                        />
                        {submitted &&
                            (localConfig.minReviewers === undefined ||
                                localConfig.minReviewers < 1) && (
                                <small className="p-error">
                                    Min Reviewers must be at least 1.
                                </small>
                            )}
                    </div>

                    <div className="field col">
                        <label className="font-bold">Max Reviewers</label>
                        <InputNumber
                            value={localConfig.maxReviewers}
                            onValueChange={(e) =>
                                setLocalConfig((p) => ({
                                    ...p,
                                    maxReviewers: e.value ?? 1,
                                }))
                            }
                            min={localConfig.minReviewers || 1}
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    (localConfig.maxReviewers === undefined ||
                                        localConfig.maxReviewers <
                                        (localConfig.minReviewers || 1)),
                            })}
                        />
                        {submitted &&
                            (localConfig.maxReviewers === undefined ||
                                localConfig.maxReviewers <
                                (localConfig.minReviewers || 1)) && (
                                <small className="p-error">
                                    Max Reviewers must be greater than or equal to
                                    Min Reviewers.
                                </small>
                            )}
                    </div>
                </div>

                {/* Min Acceptance Score */}
                <div className="field">
                    <label className="font-bold">
                        Min Acceptance Score {localConfig.evaluation && `(Max: ${maxPossibleScore})`}
                    </label>
                    <InputNumber
                        value={localConfig.minAcceptanceScore ?? 0}
                        min={0}
                        max={maxPossibleScore}
                        onValueChange={(e) =>
                            setLocalConfig((p) => ({
                                ...p,
                                minAcceptanceScore: e.value ?? 0,
                            }))
                        }
                        className={classNames({
                            'p-invalid':
                                submitted &&
                                (localConfig.minAcceptanceScore ?? 0) > maxPossibleScore,
                        })}
                    />
                    {submitted && (localConfig.minAcceptanceScore ?? 0) > maxPossibleScore && (
                        <small className="p-error">
                            Score cannot exceed {maxPossibleScore}
                        </small>
                    )}
                </div>

                {/* Max Attempts */}
                <div className="field">
                    <label className="font-bold">Max Attempts</label>
                    <InputNumber
                        value={localConfig.maxAttempts}
                        onValueChange={(e) =>
                            setLocalConfig((p) => ({
                                ...p,
                                maxAttempts: e.value ?? 1,
                            }))
                        }
                        min={1}
                        className={classNames({
                            'p-invalid':
                                submitted &&
                                (localConfig.maxAttempts === undefined ||
                                    localConfig.maxAttempts < 1),
                        })}
                    />
                    {submitted &&
                        (localConfig.maxAttempts === undefined ||
                            localConfig.maxAttempts < 1) && (
                            <small className="p-error">
                                Max Attempts must be at least 1.
                            </small>
                        )}
                </div>
            </Dialog>
        </>
    );
};

export default SaveVerificationConfiguration;