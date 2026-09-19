'use client';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Steps } from 'primereact/steps';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';

import { sanitize } from '@/utils/utils';
import { CallApi } from '../../api/call.api';
import { Call, validateCall } from '../../models/call.model';
import { CallInfoStep } from './CallInfoStep';
import { CallReviewStep } from './CallReviewStep';
import { CallStagesStep } from './CallStagesStep';

export const SaveCallWizard = ({
    visible,
    item,
    onHide,
    onComplete
}: EntitySaveDialogProps<Call>) => {
    const toast = useRef<Toast>(null);

    const [activeIndex, setActiveIndex] = useState(0);
    const [saving, setSaving] = useState(false);

    const isEditMode = !!item?._id;

    const [callData, setCallData] = useState<Partial<Call>>({
        title: '',
        description: '',
        stages: [
            {
                name: 'Concept Note',
                order: 1,
                minAcceptanceScore: 50,
                deadline: new Date()
            }
        ]
    });

    useEffect(() => {
        if (!visible) return;

        setCallData({
            ...item,
            title: item?.title || '',
            description: item?.description || '',
            stages:
                item?.stages && item.stages.length > 0
                    ? item.stages
                    : [
                          {
                              name: 'Concept Note',
                              order: 1,
                              minAcceptanceScore: 50,
                              deadline: new Date()
                          }
                      ]
        });

        setActiveIndex(0);
    }, [visible, item]);

    const wizardItems = [
        { label: 'Call Info' },
        { label: 'Stages & Deadlines' },
        { label: 'Review & Finish' }
    ];

    const updateCallData = (data: Partial<Call>) => {
        setCallData((prev) => ({
            ...prev,
            ...data
        }));
    };

    const handleNext = () => {
        setActiveIndex((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveIndex((prev) => prev - 1);
    };

    const handleSaveWizard = async () => {
        try {
            setSaving(true);

            const validation = validateCall(callData as Call);

            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const payload = sanitize(callData as Call);

            let savedCall: Call;

            if (isEditMode && callData._id) {
                savedCall = await CallApi.update(callData);
            } else {
                savedCall = await CallApi.create(callData);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: isEditMode
                    ? 'Call updated successfully'
                    : 'Call and Stages created successfully',
                life: 1000
            });

            setTimeout(() => {
                onComplete?.({...savedCall, ...callData});
                onHide();
            }, 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Call',
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
                        isEditMode={isEditMode}
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

    const footer = isEditMode ? (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                onClick={onHide}
            />

            <Button
                label="Save Changes"
                icon="pi pi-check"
                onClick={handleSaveWizard}
                loading={saving}
                className="w-auto px-4"
            />
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
                footer={footer}
                maximizable
                maximized
            >
                <div className="call-wizard pt-2">
                    {isEditMode ? (
                        /*
                         * Edit mode:
                         * Reuse the same CallInfoStep instead of
                         * maintaining a separate edit form.
                         */
                        <CallInfoStep
                            data={callData}
                            onUpdate={updateCallData}
                            onNext={() => {}}
                            isEditMode
                        />
                    ) : (
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