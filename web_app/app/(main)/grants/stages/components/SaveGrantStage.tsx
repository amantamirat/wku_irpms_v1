'use client';

import { EvaluationApi } from '@/app/(main)/evaluations/api/evaluation.api';
import { Evaluation } from '@/app/(main)/evaluations/models/evaluation.model';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState, useMemo } from 'react';
import { GrantStageApi } from '../api/grant.stage.api';
import { GrantStage, DecisionMode, validateGrantStage } from '../models/grant.stage.model';
import { Grant } from '../../models/grant.model';
import { GrantApi } from '../../api/grant.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { EvaluationStatus } from '@/app/(main)/evaluations/models/evaluation.state-machine';

const SaveStage = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<GrantStage>) => {
    const toast = useRef<Toast>(null);

    const [localStage, setLocalStage] = useState<GrantStage>({
        ...item,
        decisionMode: item.decisionMode ?? DecisionMode.MANUAL,
        minAcceptanceScore: item.minAcceptanceScore ?? 0,
    });

    const [submitted, setSubmitted] = useState(false);
    const [grants, setGrants] = useState<Grant[] | undefined>(undefined);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    const isGrantPredefined = !!item.grant;
    const isEvaluationPredefined = !!item.evaluation;

    // Helper to get max possible score from the selected evaluation
    const maxPossibleScore = useMemo(() => {
        const evalObj = localStage.evaluation as Evaluation;
        return evalObj?.weight ?? 100; // Fallback to 100 if weight isn't defined
    }, [localStage.evaluation]);

    useEffect(() => {
        if (!isGrantPredefined) {
            GrantApi.getAll().then(setGrants).catch(console.error);
        }
    }, [isGrantPredefined]);

    useEffect(() => {
        if (!isEvaluationPredefined) {
            EvaluationApi.getAll({ status: EvaluationStatus.published })
                .then(setEvaluations)
                .catch(console.error);
        }
    }, [isEvaluationPredefined]);

    useEffect(() => {
        setLocalStage({
            ...item,
            decisionMode: item.decisionMode ?? DecisionMode.MANUAL,
            minAcceptanceScore: item.minAcceptanceScore ?? 0,
        });
    }, [item]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalStage({
            ...item,
            decisionMode: DecisionMode.MANUAL,
            minAcceptanceScore: 0,
        });
    };

    const saveStage = async () => {
        try {
            setSubmitted(true);

            // 1. Custom Weight Validation
            if (localStage.minAcceptanceScore > maxPossibleScore) {
                throw new Error(`Min Acceptance Score cannot exceed the Evaluation weight (${maxPossibleScore})`);
            }

            const validation = validateGrantStage(localStage);
            if (!validation.valid) throw new Error(validation.message);

            let saved: GrantStage;
            if (localStage._id) {
                saved = await GrantStageApi.update(localStage);
            } else {
                saved = await GrantStageApi.create(localStage);
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
                {/* Grant */}
                <div className="field">
                    <label className="font-bold">Grant</label>
                    {isGrantPredefined ? (
                        <InputText value={(localStage.grant as Grant)?.title} disabled />
                    ) : (
                        <Dropdown
                            value={localStage.grant}
                            dataKey="_id"
                            options={grants}
                            optionLabel="title"
                            placeholder="Select a Grant"
                            onChange={(e) => setLocalStage((p) => ({ ...p, grant: e.value }))}
                        />
                    )}
                </div>

                {/* Name */}
                <div className="field">
                    <label className="font-bold">Stage Name</label>
                    <InputText
                        value={localStage.name}
                        onChange={(e) => setLocalStage((p) => ({ ...p, name: e.target.value }))}
                        className={classNames({ 'p-invalid': submitted && !localStage.name })}
                    />
                </div>

                {/* Evaluation */}
                <div className="field">
                    <label className="font-bold">Evaluation</label>
                    {isEvaluationPredefined ? (
                        <InputText value={(localStage.evaluation as Evaluation)?.title} disabled />
                    ) : (
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
                                    // Reset score if it exceeds new evaluation weight
                                    minAcceptanceScore: p.minAcceptanceScore > (e.value?.weight || 100) ? 0 : p.minAcceptanceScore
                                }));
                            }}
                        />
                    )}
                </div>

                {/* Reviewers */}
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

                {/* Decision Mode */}
                <div className="field">
                    <label className="font-bold">Decision Mode</label>
                    <Dropdown
                        value={localStage.decisionMode}
                        options={[
                            { label: 'Manual', value: DecisionMode.MANUAL },
                            { label: 'Automatic', value: DecisionMode.AUTOMATIC },
                        ]}
                        onChange={(e) => setLocalStage((p) => ({ ...p, decisionMode: e.value }))}
                    />
                </div>

                {/* Min Acceptance Score - Now visible in both modes */}
                <div className="field">
                    <label className="font-bold">
                        Min Acceptance Score {localStage.evaluation && `(Max: ${maxPossibleScore})`}
                    </label>
                    <InputNumber
                        value={localStage.minAcceptanceScore}
                        min={0}
                        max={maxPossibleScore}
                        onValueChange={(e) =>
                            setLocalStage((p) => ({
                                ...p,
                                minAcceptanceScore: e.value ?? 0,
                            }))
                        }
                        className={classNames({ 'p-invalid': submitted && localStage.minAcceptanceScore > maxPossibleScore })}
                    />
                    {submitted && localStage.minAcceptanceScore > maxPossibleScore && (
                        <small className="p-error">Score cannot exceed {maxPossibleScore}</small>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SaveStage;