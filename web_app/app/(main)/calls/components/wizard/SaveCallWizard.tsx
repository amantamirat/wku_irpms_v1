'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Steps } from 'primereact/steps';
import { Toast } from 'primereact/toast';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

// APIs & Models
import { StageApi } from '../../stages/api/stage.api';
import { Stage } from '../../stages/models/stage.model';
import { Call, validateCall } from '../../models/call.model';
import { sanitize } from '@/utils/utils';
import { CallApi } from '../../api/call.api';
import { CallStagesStep } from './CallStagesStep';
import { CallReviewStep } from './CallReviewStep';
import { CallInfoStep } from './CallInfoStep';


export const SaveCallWizard = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Call>) => {
    const toast = useRef<Toast>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [saving, setSaving] = useState(false);

    const [callData, setCallData] = useState<Partial<Call>>({ ...item });
    const [stages, setStages] = useState<Partial<Stage>[]>([]);

    useEffect(() => {
        if (visible) {
            setCallData({ ...item });
            setActiveIndex(0);
            if (!item._id) {
                // Default starter stage for new Call
                setStages([{ name: 'Concept Note', order: 1, minAcceptanceScore: 50 }]);
            }
        }
    }, [visible, item]);

    const wizardItems = [
        { label: 'Call Info' },
        { label: 'Stages & Deadlines' },
        { label: 'Review & Finish' }
    ];

    const handleSaveWizard = async () => {
        try {
            setSaving(true);
            const validation = validateCall(callData as Call);
            if (!validation.valid) throw new Error(validation.message);

            const payload = sanitize(callData as Call);
            let savedCall: Call;

            if (callData._id) {
                savedCall = await CallApi.update(payload as Call);
            } else {
                savedCall = await CallApi.create(payload as Call);
            }

            // Persist Stages linked to newly created Call ID
            if (stages.length > 0) {
                const stagePromises = stages.map(stg => {
                    const stagePayload = { ...stg, call: savedCall._id };
                    return stg._id ? StageApi.update(stagePayload as Stage) : StageApi.create(stagePayload as Stage);
                });
                await Promise.all(stagePromises);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Call and Stages created successfully',
                life: 2000
            });

            onComplete?.(savedCall);
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

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '750px' }}
                header={callData._id ? 'Edit Call Setup' : 'New Strategic Call Wizard'}
                modal
                onHide={onHide}
                maximizable
                maximized
            >
                <Steps model={wizardItems} activeIndex={activeIndex} onSelect={(e) => setActiveIndex(e.index)} readOnly={false} className="mb-4" />

                {activeIndex === 0 && (
                    <CallInfoStep
                        data={callData}
                        onUpdate={setCallData}
                        onNext={() => setActiveIndex(1)}
                    />
                )}

                {activeIndex === 1 && (
                    <CallStagesStep
                        stages={stages}
                        onUpdateStages={setStages}
                        onNext={() => setActiveIndex(2)}
                        onBack={() => setActiveIndex(0)}
                    />
                )}

                {activeIndex === 2 && (
                    <CallReviewStep
                        callData={callData}
                        stages={stages}
                        onSave={handleSaveWizard}
                        onBack={() => setActiveIndex(1)}
                        saving={saving}
                    />
                )}
            </Dialog>
        </>
    );
};

export default SaveCallWizard;