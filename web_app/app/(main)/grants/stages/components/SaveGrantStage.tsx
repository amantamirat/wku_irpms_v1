'use client';
import { EvaluationApi } from '@/app/(main)/evaluations/api/evaluation.api';
import { Evaluation } from '@/app/(main)/evaluations/models/evaluation.model';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber'; // New Import
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { GrantStageApi } from '../api/grant.stage.api';
import { GrantStage, validateGrantStage } from '../models/grant.stage.model';
import { Grant } from '../../models/grant.model';
import { GrantApi } from '../../api/grant.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { EvaluationStatus } from '@/app/(main)/evaluations/models/evaluation.state-machine';

const SaveStage = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<GrantStage>) => {
    const toast = useRef<Toast>(null);
    const [localStage, setLocalStage] = useState<GrantStage>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    const [grants, setGrants] = useState<Grant[] | undefined>(undefined);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const isGrantPredefined = !!item.grant;
    const isEvaluationPredefined = !!item.evaluation;

    useEffect(() => {
        if (isGrantPredefined) return;
        const loadGrants = async () => {
            try {
                const data = await GrantApi.getAll();
                setGrants(data);
            } catch (err) {
                console.error('Failed to load grants:', err);
            }
        };
        loadGrants();
    }, [isGrantPredefined]);

    useEffect(() => {
        if (isEvaluationPredefined) return;
        const fetchEvaluations = async () => {
            try {
                const data = await EvaluationApi.getAll({ status: EvaluationStatus.published });
                setEvaluations(data);
            } catch (err) {
                console.error('Failed to fetch evaluations:', err);
            }
        };
        fetchEvaluations();
    }, [isEvaluationPredefined]);

    useEffect(() => {
        setLocalStage({ ...item });
    }, [item]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalStage({ ...item });
    };

    const saveStage = async () => {
        try {
            setSubmitted(true);
            const validation = validateGrantStage(localStage);
            if (!validation.valid) throw new Error(validation.message);

            let saved: GrantStage;

            if (localStage._id) saved = await GrantStageApi.update(localStage);
            else saved = await GrantStageApi.create(localStage);

            saved = {
                ...saved,
                grant: localStage.grant,
                evaluation: localStage.evaluation
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Stage saved successfully',
                life: 2000,
            });

            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Stage',
                life: 2000,
            });
        }
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
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
                onHide={hide}
            >
                {/* Grant Selector */}
                <div className="field">
                    <label htmlFor="grant">Grant</label>
                    {isGrantPredefined ? (
                        <InputText value={(localStage.grant as Grant)?.title} disabled />
                    ) : (
                        <Dropdown
                            id="grant"
                            value={localStage.grant}
                            dataKey="_id"
                            options={grants}
                            optionLabel="title"
                            onChange={(e) => setLocalStage({ ...localStage, grant: e.value })}
                            placeholder="Select Grant"
                            className={classNames({ 'p-invalid': submitted && !localStage.grant })}
                        />
                    )}
                </div>

                {/* Stage Name */}
                <div className="field">
                    <label htmlFor="name">Stage Name</label>
                    <InputText
                        id="name"
                        value={localStage.name}
                        onChange={(e) => setLocalStage({ ...localStage, name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localStage.name })}
                    />
                </div>

                {/* Evaluation Selector */}
                <div className="field">
                    <label htmlFor="evaluation">Evaluation</label>
                    {isEvaluationPredefined ? (
                        <InputText value={(localStage.evaluation as Evaluation)?.title} disabled />
                    ) : (
                        <Dropdown
                            id="evaluation"
                            dataKey="_id"
                            value={localStage.evaluation}
                            options={evaluations}
                            optionLabel="title"
                            onChange={(e) => setLocalStage({ ...localStage, evaluation: e.value })}
                            placeholder="Select Evaluation"
                            className={classNames({ 'p-invalid': submitted && !localStage.evaluation })}
                        />
                    )}
                </div>

                {/* Reviewer Limits */}
                <div className="formgrid grid">
                    <div className="field col">
                        <label htmlFor="minReviewers">Min Reviewers</label>
                        <InputNumber
                            id="minReviewers"
                            value={localStage.minReviewers}
                            onValueChange={(e) => setLocalStage({ ...localStage, minReviewers: e.value ?? undefined })}
                            min={0}
                            showButtons
                            buttonLayout="stacked"
                        />
                    </div>
                    <div className="field col">
                        <label htmlFor="maxReviewers">Max Reviewers</label>
                        <InputNumber
                            id="maxReviewers"
                            value={localStage.maxReviewers}
                            onValueChange={(e) => setLocalStage({ ...localStage, maxReviewers: e.value ?? undefined })}
                            min={0}
                            showButtons
                            buttonLayout="stacked"
                        />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveStage;