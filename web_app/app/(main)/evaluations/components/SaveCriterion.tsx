'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { CriterionApi } from '../api/criterion.api';
import { Criterion, FormType, validateCriterion } from '../models/criterion.model';
import { Evaluation } from '../../evaluations/models/evaluation.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveCriterion = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Criterion>) => {
    const toast = useRef<Toast>(null);

    const [localCriterion, setLocalCriterion] = useState<Criterion>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    const formTypeOptions = [
        { label: 'Open', value: FormType.open },
        { label: 'Closed', value: FormType.closed },
    ];

    useEffect(() => {
        setLocalCriterion({ ...item });
    }, [item]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalCriterion({ ...item });
    };

    const saveCriterion = async () => {
        setSubmitted(true);
        try {
            const validation = validateCriterion(localCriterion);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved = localCriterion._id
                ? await CriterionApi.update(localCriterion)
                : await CriterionApi.create(localCriterion);

            // keep evaluation reference for UI consistency
            saved = {
                ...saved,
                evaluation: localCriterion.evaluation as Evaluation
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Criterion saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Criterion',
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
            <Button label="Save" icon="pi pi-check" text onClick={saveCriterion} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localCriterion._id ? 'Edit Criterion' : 'New Criterion'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Evaluation Info (Read Only) */}
                <div className="field">
                    <label htmlFor="evaluation">Evaluation</label>
                    <InputText
                        id="evaluation"
                        value={
                            typeof localCriterion.evaluation === 'object'
                                ? (localCriterion.evaluation as Evaluation).title
                                : ''
                        }
                        disabled
                    />
                </div>

                {/* Title Field */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localCriterion.title}
                        onChange={(e) => setLocalCriterion({ ...localCriterion, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localCriterion.title })}
                    />
                </div>

                {/* Weight Field */}
                <div className="field">
                    <label htmlFor="weight">Weight</label>
                    <InputNumber
                        id="weight"
                        value={localCriterion.weight}
                        onValueChange={(e) => setLocalCriterion({ ...localCriterion, weight: e.value ?? 0 })}
                        required
                        min={1}
                        className={classNames({ 'p-invalid': submitted && (!localCriterion.weight || localCriterion.weight <= 0) })}
                    />
                </div>

                {/* Form Type Field */}
                <div className="field">
                    <label htmlFor="formType">Form Type</label>
                    <Dropdown
                        id="formType"
                        value={localCriterion.formType}
                        options={formTypeOptions}
                        onChange={(e) => setLocalCriterion({ ...localCriterion, formType: e.value })}
                        placeholder="Select Form Type"
                        className={classNames({ 'p-invalid': submitted && !localCriterion.formType })}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveCriterion;