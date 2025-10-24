'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { EvalType, Evaluation, FormType, validateEvaluation } from '../../models/evaluation.model';
import { EvaluationApi } from '../../api/evaluation.api';
import { Toast } from 'primereact/toast';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { Organization, OrganizationalUnit } from '@/app/(main)/organizations/models/organization.model';


interface SaveDialogProps {
    visible: boolean;
    evaluation: Evaluation;
    onComplete?: (saved: Evaluation) => void;
    onHide: () => void;
}

const SaveDialog = ({ visible, evaluation, onComplete, onHide }: SaveDialogProps) => {
    const toast = useRef<Toast>(null);
    const [localEvaluation, setLocalEvaluation] = useState<Evaluation>({ ...evaluation });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [directorates, setDirectorates] = useState<Organization[]>([]);

    const isEvaluation = localEvaluation.type === EvalType.evaluation;
    const isStage = localEvaluation.type === EvalType.stage;
    const isCriterion = localEvaluation.type === EvalType.criterion;
    const isOption = localEvaluation.type === EvalType.option;

    // Fetch directorates for evaluation creation
    useEffect(() => {
        const fetchDirectorates = async () => {
            try {
                const data = await OrganizationApi.getOrganizations({ type: OrganizationalUnit.Directorate });
                setDirectorates(data);
            } catch (err) {
                console.error('Failed to fetch directorates', err);
            }
        };
        fetchDirectorates();
    }, []);

    useEffect(() => {
        setLocalEvaluation({ ...evaluation });
    }, [evaluation]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalEvaluation({ ...evaluation });
    };

    const saveEvaluation = async () => {
        try {
            setSubmitted(true);
            const validation = validateEvaluation(localEvaluation);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved: Evaluation;
            if (localEvaluation._id) {
                saved = await EvaluationApi.updateEvaluation(localEvaluation);
            } else {
                saved = await EvaluationApi.createEvaluation(localEvaluation);
            }
            saved = {
                ...saved,
                directorate: localEvaluation.directorate,
                parent: localEvaluation.parent
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Evaluation saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save evaluation',
                detail: err.message || 'An error occurred',
                life: 2000,
            });
        }
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
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
                header={localEvaluation._id ? `Edit ${localEvaluation.type}` : `New ${localEvaluation.type}`}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {(isEvaluation && !localEvaluation._id) && (
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
                )}

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

                {(isCriterion || isOption) && (
                    <div className="field">
                        <label htmlFor="weight_value">{isCriterion ? 'Weight' : 'Value'}</label>
                        <InputNumber
                            id="weight_value"
                            value={localEvaluation.weight_value}
                            onChange={(e) =>
                                setLocalEvaluation({ ...localEvaluation, weight_value: e.value || 0 })
                            }
                            required
                            className={classNames({
                                'p-invalid': submitted && (isCriterion || isOption) && (localEvaluation.weight_value == null),
                            })}
                        />
                    </div>
                )}

                {isCriterion && (
                    <div className="field">
                        <label htmlFor="form_type">Form Type</label>
                        <Dropdown
                            id="form_type"
                            value={localEvaluation.form_type}
                            options={Object.values(FormType).map(f => ({ label: f, value: f }))}
                            onChange={(e) => setLocalEvaluation({ ...localEvaluation, form_type: e.value })}
                            placeholder="Select Form Type"
                            className={classNames({ 'p-invalid': submitted && !localEvaluation.form_type })}
                        />
                    </div>
                )}

                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
};

export default SaveDialog;
