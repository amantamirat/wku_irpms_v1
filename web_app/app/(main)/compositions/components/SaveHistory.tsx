'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { HistoryRule, validateHistoryRule } from '../models/history.model';
import { HistoryApi } from '../api/history.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { IRange } from '@/types/range';

type ProjectMetric = 'granted' | 'refused' | 'completed';
type ApplicationMetric = 'submitted' | 'accepted' | 'rejected';

// Helper to initialize history rule state with nested structures safely
const initializeHistory = (
    item?: Partial<HistoryRule>
): Partial<HistoryRule> => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    project: item?.project ? { ...item.project } : undefined,
    application: item?.application ? { ...item.application } : undefined,
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

    const updateNestedRange = (
        category: 'project' | 'application',
        field: ProjectMetric | ApplicationMetric,
        bound: 'min' | 'max',
        value: number | null
    ) => {
        setLocalHistory((prev) => {
            const currentCategory = prev[category] ? { ...prev[category] } : {};
            const currentRange = (currentCategory[field as keyof typeof currentCategory] as IRange | undefined) || { min: 0, max: 0 };

            const updatedRange: Partial<IRange> = {
                ...currentRange,
                [bound]: value ?? undefined
            };

            // If both bounds are cleared, remove the metric field
            if (updatedRange.min === undefined && updatedRange.max === undefined) {
                const categoryCopy = { ...currentCategory };
                delete categoryCopy[field as keyof typeof categoryCopy];

                // If the entire category object is now empty, omit it
                if (Object.keys(categoryCopy).length === 0) {
                    const prevCopy = { ...prev };
                    delete prevCopy[category];
                    return prevCopy;
                }

                return {
                    ...prev,
                    [category]: categoryCopy
                };
            }

            return {
                ...prev,
                [category]: {
                    ...currentCategory,
                    [field]: updatedRange as IRange
                }
            };
        });
    };

    const renderRange = (
        label: string,
        category: 'project' | 'application',
        field: ProjectMetric | ApplicationMetric
    ) => {
        const range = localHistory[category]?.[field as keyof typeof localHistory[typeof category]] as IRange | undefined;

        return (
            <div className="formgrid grid mb-3" key={field}>
                <div className="col-12 font-medium text-sm text-700">
                    {label}
                </div>

                <div className="field col-6">
                    <label className="text-xs">Minimum</label>
                    <InputNumber
                        value={range?.min ?? null}
                        onValueChange={(e) =>
                            updateNestedRange(category, field, 'min', e.value ?? null)
                        }
                        min={0}
                        placeholder="0"
                    />
                </div>

                <div className="field col-6">
                    <label className="text-xs">Maximum</label>
                    <InputNumber
                        value={range?.max ?? null}
                        onValueChange={(e) =>
                            updateNestedRange(category, field, 'max', e.value ?? null)
                        }
                        min={0}
                        placeholder="No Limit"
                    />
                </div>
            </div>
        );
    };

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

                {/* Project History */}
                <div className="surface-border border-1 border-round p-3 mt-3 surface-card">
                    <div className="font-semibold text-900 mb-3 flex align-items-center">
                        <i className="pi pi-folder mr-2 text-green-500" />
                        Project History
                    </div>

                    {renderRange('Granted Projects', 'project', 'granted')}
                    {renderRange('Refused Projects', 'project', 'refused')}
                    {renderRange('Completed Projects', 'project', 'completed')}
                </div>

                {/* Application History */}
                <div className="surface-border border-1 border-round p-3 mt-3 surface-card">
                    <div className="font-semibold text-900 mb-3 flex align-items-center">
                        <i className="pi pi-file mr-2 text-blue-500" />
                        Application History
                    </div>

                    {renderRange('Submitted Applications', 'application', 'submitted')}
                    {renderRange('Accepted Applications', 'application', 'accepted')}
                    {renderRange('Rejected Applications', 'application', 'rejected')}
                </div>
            </Dialog>
        </>
    );
};

export default SaveHistory;