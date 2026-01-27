'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Organization } from '../../organizations/models/organization.model';
import { EvaluationApi } from '../api/evaluation.api';
import { Evaluation, validateEvaluation } from '../models/evaluation.model';
import { useDirectorate } from '@/contexts/DirectorateContext';

interface SaveEvaluatioProps {
    visible: boolean;
    evaluation: Evaluation;
    onComplete?: (savedEvaluation: Evaluation) => void;
    onHide: () => void;
}

const SaveEvaluation = ({ visible, evaluation, onComplete, onHide }: SaveEvaluatioProps) => {

    const toast = useRef<Toast>(null);

    const [localEvaluation, setLocalEvaluation] = useState<Evaluation>({ ...evaluation });
    const [submitted, setSubmitted] = useState(false);
    const { directorates } = useDirectorate();

    useEffect(() => {
        setLocalEvaluation({ ...evaluation });
    }, [evaluation]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalEvaluation({ ...evaluation });
    };

    const saveEvaluation = async () => {
        setSubmitted(true);
        try {
            const validation = validateEvaluation(localEvaluation);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved = localEvaluation._id
                ? await EvaluationApi.updateEvaluation(localEvaluation)
                : await EvaluationApi.createEvaluation(localEvaluation);

            saved = {
                ...saved,
                directorate: localEvaluation.directorate
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Evaluation saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Evaluation',
                life: 2500,
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
            <Button label="Save" icon="pi pi-check" text onClick={saveEvaluation} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localEvaluation._id ? 'Edit Evaluation' : 'New Evaluation'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Directorate Selector */}
                <div className="field">
                    <label htmlFor="directorate">Directorate</label>
                    <Dropdown
                        id="directorate"
                        value={localEvaluation.directorate}
                        options={directorates}
                        optionLabel="name"
                        onChange={(e) => setLocalEvaluation({ ...localEvaluation, directorate: e.value })}
                        placeholder="Select Directorate"
                        className={classNames({ 'p-invalid': submitted && !localEvaluation.directorate })}
                    />
                </div>

                {/* Title Field */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localEvaluation.title}
                        onChange={(e) => setLocalEvaluation({ ...localEvaluation, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localEvaluation.title })}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveEvaluation;
