'use client';

import { EvaluationApi } from '@/app/(main)/evaluations/api/evaluation.api';
import { Evaluation } from '@/app/(main)/evaluations/models/evaluation.model';
import { EvaluationStatus } from '@/app/(main)/evaluations/models/evaluation.state-machine';
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

// API & Models
import { CallApi } from '@/app/(main)/calls/api/call.api';
import { Call } from '@/app/(main)/calls/models/call.model';
import { StageApi } from '../api/stage.api';
import { Stage } from '../models/stage.model';


const stageOptions = [
    { label: 'Concept Note', value: 'Concept Note' },
    { label: 'Proposal', value: 'Proposal' },
    { label: 'Manuscript', value: 'Manuscript' },
    { label: 'Eligibility Screening', value: 'Eligibility Screening' },
    { label: 'Peer Review', value: 'Peer Review' },
    { label: 'Verification & Audit', value: 'Verification & Audit' },
    { label: 'Final Selection', value: 'Final Selection' }
];


const SaveStage = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Stage>) => {
    const toast = useRef<Toast>(null);

    const [localStage, setLocalStage] = useState<Partial<Stage>>({
        ...item,
        deadline: item?.deadline ? new Date(item.deadline) : undefined,
    });

    const [submitted, setSubmitted] = useState(false);
    const [calls, setCalls] = useState<Call[] | undefined>(undefined);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    const isCallPredefined = !!item?.call;

    // Helper to extract the max score from the selected evaluation
    const maxPossibleScore = useMemo(() => {
        const evalObj = localStage.evaluation as Evaluation;
        return evalObj?.weight ?? 100;
    }, [localStage.evaluation]);

    // Fetch calls if not predefined in `item`
    useEffect(() => {
        if (!isCallPredefined) {
            CallApi.getAll().then(setCalls).catch(console.error);
        }
    }, [isCallPredefined]);

    // Fetch published evaluations
    useEffect(() => {
        EvaluationApi.getAll({ status: EvaluationStatus.published })
            .then(setEvaluations)
            .catch(console.error);
    }, []);

    // Sync local state on item prop changes
    useEffect(() => {
        setLocalStage({
            ...item,
            deadline: item?.deadline ? new Date(item.deadline) : undefined,
        });
    }, [item]);

    // Clear form on modal close
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalStage({
            ...item,
            deadline: undefined,
        });
    };

    const saveStage = async () => {
        try {
            setSubmitted(true);

            // Validation
            if (!localStage.call) {
                throw new Error('Please select a Call.');
            }
            if (!localStage.name?.trim()) {
                throw new Error('Stage Name is required.');
            }
            if (!localStage.deadline) {
                throw new Error('Deadline is required.');
            }

            if ((localStage.minAcceptanceScore ?? 0) > maxPossibleScore) {
                throw new Error(`Min Acceptance Score cannot exceed Evaluation weight (${maxPossibleScore})`);
            }

            let saved: Stage;
            if (localStage._id) {
                saved = await StageApi.update(localStage as Stage);
            } else {
                saved = await StageApi.create(localStage as Stage);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Stage saved successfully',
                life: 2000,
            });

            onComplete?.({ ...saved, evaluation: localStage.evaluation });
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Stage',
                life: 3000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" onClick={saveStage} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localStage._id ? 'Edit Stage' : 'New Stage'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {/* Call Selection */}
                <div className="field">
                    <label className="font-bold">Call</label>
                    {isCallPredefined ? (
                        <InputText value={(localStage.call as Call)?.title || (localStage.call as string)} disabled />
                    ) : (
                        <Dropdown
                            value={localStage.call}
                            dataKey="_id"
                            options={calls}
                            optionLabel="title"
                            placeholder="Select a Call"
                            onChange={(e) => setLocalStage((p) => ({ ...p, call: e.value }))}
                            className={classNames({ 'p-invalid': submitted && !localStage.call })}
                        />
                    )}
                    {submitted && !localStage.call && <small className="p-error">Call is required.</small>}
                </div>

                {/* Stage Name */}
                {/* Stage Name */}
                <div className="field">
                    <label className="font-bold">Stage Name</label>
                    <Dropdown
                        value={localStage.name || ''}
                        options={stageOptions}
                        onChange={(e) => setLocalStage((p) => ({ ...p, name: e.value }))}
                        editable
                        placeholder="Select or enter a stage name"
                        className={classNames({ 'p-invalid': submitted && !localStage.name })}
                    />
                    {submitted && !localStage.name && (
                        <small className="p-error">Stage Name is required.</small>
                    )}
                </div>

                {/* Deadline */}
                <div className="field">
                    <label className="font-bold">Deadline</label>
                    <Calendar
                        value={localStage.deadline}
                        onChange={(e) => setLocalStage((p) => ({ ...p, deadline: e.value as Date }))}
                        showIcon
                        placeholder="Select Stage Deadline"
                        showTime
                        stepMinute={5}
                        hourFormat='12'
                        className={classNames({ 'p-invalid': submitted && !localStage.deadline })}
                    />
                    {submitted && !localStage.deadline && <small className="p-error">Deadline is required.</small>}
                </div>

                {/* Evaluation Selection */}
                <div className="field">
                    <label className="font-bold">Evaluation</label>
                    <Dropdown
                        value={localStage.evaluation}
                        dataKey="_id"
                        options={evaluations}
                        optionLabel="title"
                        placeholder="Select an Evaluation"
                        onChange={(e) => {
                            setLocalStage((p) => ({
                                ...p,
                                evaluation: e.value,
                                minAcceptanceScore:
                                    (p.minAcceptanceScore ?? 0) > (e.value?.weight || 100) ? 0 : p.minAcceptanceScore,
                            }));
                        }}
                    />
                </div>

                {/* Min / Max Reviewers */}
                <div className="formgrid grid">
                    <div className="field col">
                        <label className="font-bold">Min Reviewers</label>
                        <InputNumber
                            value={localStage.minReviewers}
                            onValueChange={(e) => setLocalStage((p) => ({ ...p, minReviewers: e.value ?? undefined }))}
                        />
                    </div>
                    <div className="field col">
                        <label className="font-bold">Max Reviewers</label>
                        <InputNumber
                            value={localStage.maxReviewers}
                            onValueChange={(e) => setLocalStage((p) => ({ ...p, maxReviewers: e.value ?? undefined }))}
                        />
                    </div>
                </div>

                {/* Min Acceptance Score */}
                <div className="field">
                    <label className="font-bold">
                        Min Acceptance Score {localStage.evaluation && `(Max: ${maxPossibleScore})`}
                    </label>
                    <InputNumber
                        value={localStage.minAcceptanceScore ?? 0}
                        min={0}
                        max={maxPossibleScore}
                        onValueChange={(e) =>
                            setLocalStage((p) => ({
                                ...p,
                                minAcceptanceScore: e.value ?? 0,
                            }))
                        }
                        className={classNames({
                            'p-invalid': submitted && (localStage.minAcceptanceScore ?? 0) > maxPossibleScore,
                        })}
                    />
                    {submitted && (localStage.minAcceptanceScore ?? 0) > maxPossibleScore && (
                        <small className="p-error">Score cannot exceed {maxPossibleScore}</small>
                    )}
                </div>

                {/* Stage Order */}
                <div className="field">
                    <label className="font-bold">Order</label>
                    <InputNumber
                        value={localStage.order}
                        onValueChange={(e) => setLocalStage((p) => ({ ...p, order: e.value ?? 0 }))}
                        min={0}
                    />
                </div>


            </Dialog>
        </>
    );
};

export default SaveStage;