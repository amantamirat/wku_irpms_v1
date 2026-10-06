'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';

import { HistoryParticipation, HistoryMetric, HistoryRule, validateHistoryRule } from '../models/history.model';
import { HistoryApi } from '../api/history.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { IRange } from '@/types/range';

/*
type ProjectMetric = 'granted' | 'refused' | 'completed' | 'verified';
type ApplicationMetric = 'submitted' | 'accepted' | 'rejected';
type VerificationMetric = 'submitted' | 'verified' | 'rejected';
*/

// Helper to initialize history rule state with nested structures safely
const initializeHistory = (
    item?: Partial<HistoryRule>
): Partial<HistoryRule> => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    participation: item?.participation ?? HistoryParticipation.ANY,
    /*
    project: item?.project ? { ...item.project } : undefined,
    application: item?.application ? { ...item.application } : undefined,
    verification: item?.verification ? { ...item.verification } : undefined,
    */
    total: item?.total ? { ...item.total, fields: [...item.total.fields] } : undefined,
    createdAt: item?.createdAt,
    updatedAt: item?.updatedAt,
});

const SaveHistory: React.FC<EntitySaveDialogProps<HistoryRule>> = ({
    visible,
    item,
    onComplete,
    onHide
}) => {
    const toast = useRef<Toast>(null);

    const [localHistory, setLocalHistory] = useState<Partial<HistoryRule>>(() =>
        initializeHistory(item)
    );

    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalHistory(initializeHistory(item));
    }, [item]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalHistory(initializeHistory(item));
    };

    const save = async () => {
        setSubmitted(true);
        const validation = validateHistoryRule(localHistory);

        if (!validation.valid) {
            toast.current?.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: validation.message,
                life: 3000
            });
            return;
        }

        try {
            const saved = localHistory._id
                ? await HistoryApi.update(localHistory)
                : await HistoryApi.create(localHistory);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'History rule saved successfully',
                life: 2000
            });

            if (onComplete) {
                setTimeout(() => onComplete(saved), 800);
            }
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save history rule',
                life: 2500
            });
        }
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    /*
    const updateNestedRange = (
        category: 'project' | 'application' | 'verification',
        field: ProjectMetric | ApplicationMetric | VerificationMetric,
        bound: 'min' | 'max',
        value: number | null
    ) => { ... };
    */

    const updateTotalPrice = (bound: 'min' | 'max', value: number | null) => {
        setLocalHistory((prev) => {
            const currentTotal = prev.total || { fields: [], range: { min: 0, max: 0 } };
            const currentRange = currentTotal.range || { min: 0, max: 0 };

            const updatedRange: IRange = {
                ...currentRange,
                [bound]: value ?? 0
            };

            if (updatedRange.min === 0 && updatedRange.max === 0 && (!currentTotal.fields || currentTotal.fields.length === 0)) {
                const prevCopy = { ...prev };
                delete prevCopy.total;
                return prevCopy;
            }

            return {
                ...prev,
                total: {
                    ...currentTotal,
                    range: updatedRange
                }
            };
        });
    };

    const updateTotalFields = (fields: HistoryMetric[]) => {
        setLocalHistory((prev) => {
            const currentTotal = prev.total || { fields: [], range: { min: 0, max: 0 } };
            if (fields.length === 0 && !currentTotal.range?.min && !currentTotal.range?.max) {
                const prevCopy = { ...prev };
                delete prevCopy.total;
                return prevCopy;
            }

            return {
                ...prev,
                total: {
                    ...currentTotal,
                    fields
                }
            };
        });
    };

    /*
    const renderRange = (
        label: string,
        category: 'project' | 'application' | 'verification',
        field: ProjectMetric | ApplicationMetric | VerificationMetric
    ) => { ... };
    */

    const metricOptions = Object.values(HistoryMetric).map((m) => ({
        label: m,
        value: m
    }));

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save History Rule" icon="pi pi-check" onClick={save} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '680px' }}
                header={localHistory._id ? 'Edit History Rule' : 'Create History Rule'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Name */}
                <div className="field">
                    <label htmlFor="name" className="font-semibold">
                        Rule Name <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="name"
                        value={localHistory.name || ''}
                        onChange={(e) =>
                            setLocalHistory((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className={classNames({
                            'p-invalid': submitted && !localHistory.name
                        })}
                        placeholder="e.g., Experienced Lead Researcher"
                    />
                </div>

                {/* Description */}
                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        rows={2}
                        value={localHistory.description || ''}
                        onChange={(e) =>
                            setLocalHistory((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Describe the historical requirements for this rule..."
                    />
                </div>

                {/* Participation */}
                <div className="field">
                    <label htmlFor="participation" className="font-semibold">
                        Participation <span className="text-red-500">*</span>
                    </label>

                    <Dropdown
                        id="participation"
                        value={localHistory.participation}
                        options={[
                            { label: 'Lead PI', value: HistoryParticipation.LEAD },
                            { label: 'Member', value: HistoryParticipation.MEMBER },
                            { label: 'Any', value: HistoryParticipation.ANY }
                        ]}
                        onChange={(e) =>
                            setLocalHistory((prev) => ({
                                ...prev,
                                participation: e.value
                            }))
                        }
                        placeholder="Select participation"
                        className={classNames({
                            'p-invalid': submitted && !localHistory.participation
                        })}
                    />

                    <small className="text-600">
                        Determines whether the history is counted for projects where the user was the lead PI, a member, or either.
                    </small>
                </div>

                {/* Project History */}
                {/*
                <div className="surface-border border-1 border-round p-3 mt-3 surface-card">
                    <div className="font-semibold text-900 mb-3 flex align-items-center">
                        <i className="pi pi-folder mr-2 text-green-500" />
                        Project History
                    </div>

                    {renderRange('Granted Projects', 'project', 'granted')}
                    {renderRange('Refused Projects', 'project', 'refused')}
                    {renderRange('Completed Projects', 'project', 'completed')}
                    {renderRange('Verified Projects', 'project', 'verified')}
                </div>
                */}

                {/* Application History */}
                {/*
                <div className="surface-border border-1 border-round p-3 mt-3 surface-card">
                    <div className="font-semibold text-900 mb-3 flex align-items-center">
                        <i className="pi pi-file mr-2 text-blue-500" />
                        Application History
                    </div>

                    {renderRange('Submitted Applications', 'application', 'submitted')}
                    {renderRange('Accepted Applications', 'application', 'accepted')}
                    {renderRange('Rejected Applications', 'application', 'rejected')}
                </div>
                */}

                {/* Verification History */}
                {/*
                <div className="surface-border border-1 border-round p-3 mt-3 surface-card">
                    <div className="font-semibold text-900 mb-3 flex align-items-center">
                        <i className="pi pi-check-circle mr-2 text-orange-500" />
                        Verification History
                    </div>

                    {renderRange('Submitted Verifications', 'verification', 'submitted')}
                    {renderRange('Verified Verifications', 'verification', 'verified')}
                    {renderRange('Rejected Verifications', 'verification', 'rejected')}
                </div>
                */}

                {/* Total Metrics Rule */}
                <div className="surface-border border-1 border-round p-3 mt-3 surface-card">
                    <div className="font-semibold text-900 mb-3 flex align-items-center">
                        <i className="pi pi-chart-bar mr-2 text-purple-500" />
                        Total Aggregated History Rule
                    </div>

                    <div className="field mb-3">
                        <label className="text-xs font-medium">Select Fields to Sum</label>
                        <MultiSelect
                            value={localHistory.total?.fields || []}
                            options={metricOptions}
                            onChange={(e) => updateTotalFields(e.value)}
                            placeholder="Select metrics..."
                            display="chip"
                        />
                    </div>

                    <div className="formgrid grid">
                        <div className="field col-6">
                            <label className="text-xs">Total Minimum</label>
                            <InputNumber
                                value={localHistory.total?.range?.min ?? null}
                                onValueChange={(e) => updateTotalPrice('min', e.value ?? null)}
                                min={0}
                                placeholder="0"
                            />
                        </div>

                        <div className="field col-6">
                            <label className="text-xs">Total Maximum</label>
                            <InputNumber
                                value={localHistory.total?.range?.max ?? null}
                                onValueChange={(e) => updateTotalPrice('max', e.value ?? null)}
                                min={0}
                                placeholder="No Limit"
                            />
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveHistory;