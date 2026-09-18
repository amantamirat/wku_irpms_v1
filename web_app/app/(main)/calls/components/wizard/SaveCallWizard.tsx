'use client';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Steps } from 'primereact/steps';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';

// APIs & Models
import { sanitize } from '@/utils/utils';
import { CallApi } from '../../api/call.api';
import { Call, validateCall } from '../../models/call.model';
import { CallInfoStep } from './CallInfoStep';
import { CallReviewStep } from './CallReviewStep';
import { CallStagesStep } from './CallStagesStep';

export const SaveCallWizard = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Call>) => {
    const toast = useRef<Toast>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const isEditMode = !!item?._id;

    const [callData, setCallData] = useState<Partial<Call>>({
        title: '',
        description: '',
        stages: [{ name: 'Concept Note', order: 1, minAcceptanceScore: 50, deadline: new Date() }]
    });

    useEffect(() => {
        if (visible) {
            setCallData({
                ...item,
                title: item?.title || '',
                description: item?.description || '',
                stages: item?.stages && item.stages.length > 0
                    ? item.stages
                    : [{ name: 'Concept Note', order: 1, minAcceptanceScore: 50, deadline: new Date() }]
            });
            setActiveIndex(0);
        }
    }, [visible, item]);

    const wizardItems = [
        { label: 'Call Info' },
        { label: 'Stages & Deadlines' },
        { label: 'Review & Finish' }
    ];

    const updateCallData = (data: Partial<Call>) => {
        setCallData(prev => ({ ...prev, ...data }));
    };

    const handleNext = () => {
        setActiveIndex(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveIndex(prev => prev - 1);
    };

    const handleSaveWizard = async () => {
        try {
            setSaving(true);
            const validation = validateCall(callData as Call);
            if (!validation.valid) throw new Error(validation.message);

            const payload = sanitize(callData as Call);
            let savedCall: Call;

            if (isEditMode && callData._id) {
                savedCall = await CallApi.update(payload as Call);
            } else {
                savedCall = await CallApi.create(payload as Call);
            }


            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: isEditMode ? 'Call updated successfully' : 'Call and Stages created successfully',
                life: 1000
            });
            // Wait for the toast duration (1000ms) before triggering completion and closing
            setTimeout(() => {
                onComplete?.(savedCall);
                onHide();
            }, 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Call Wizard',
                life: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    const renderStep = () => {
        switch (activeIndex) {
            case 0:
                return (
                    <CallInfoStep
                        data={callData}
                        onUpdate={updateCallData}
                        onNext={handleNext}
                    />
                );
            case 1:
                return (
                    <CallStagesStep
                        data={callData}
                        onUpdate={updateCallData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                );
            case 2:
                return (
                    <CallReviewStep
                        callData={callData}
                        stages={callData.stages || []}
                        onSave={handleSaveWizard}
                        onBack={handleBack}
                        saving={saving}
                    />
                );
            default:
                return null;
        }
    };

    // Footer used ONLY in edit mode: strictly Cancel and Save Changes, zero wizard steps or next buttons
    const editModeFooter = isEditMode ? (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save Changes" icon="pi pi-check" onClick={handleSaveWizard} loading={saving} className="w-auto px-4" />
        </div>
    ) : undefined;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '750px' }}
                header={isEditMode ? 'Edit Strategic Call' : 'New Strategic Call Wizard'}
                modal
                className="p-fluid"
                onHide={onHide}
                footer={editModeFooter}
                maximizable
                maximized
            >
                <div className="call-wizard pt-2">
                    {isEditMode ? (
                        /* Flat form view for Edit Mode — completely bypassing wizard steps and next buttons */
                        <div className="flex flex-column gap-4 mt-2">
                            <div className="field">
                                <label htmlFor="title" className="font-bold">Call Title</label>
                                <InputText
                                    id="title"
                                    value={callData.title || ''}
                                    onChange={(e) => updateCallData({ title: e.target.value })}
                                    placeholder="Enter call title..."
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="description" className="font-bold">Description</label>
                                <InputTextarea
                                    id="description"
                                    rows={4}
                                    value={callData.description || ''}
                                    onChange={(e) => updateCallData({ description: e.target.value })}
                                    placeholder="Enter description..."
                                />
                            </div>
                        </div>
                    ) : (
                        /* Multi-step wizard view strictly for Creation Mode */
                        <>
                            <Steps
                                model={wizardItems}
                                activeIndex={activeIndex}
                                onSelect={(e) => {
                                    if (e.index < activeIndex) {
                                        setActiveIndex(e.index);
                                    }
                                }}
                                className="mb-4"
                            />
                            <div className="min-h-20rem">
                                {renderStep()}
                            </div>
                        </>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SaveCallWizard;