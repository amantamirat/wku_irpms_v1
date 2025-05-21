'use client';

import { ResponseType, Weight, validateWeight } from '@/models/evaluation/weight';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Steps } from 'primereact/steps';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';
import CriterionOptionComp from '../../criterionOption/Criterion.component';
import { CriterionOption } from '@/models/evaluation/criterionOption';

interface SaveDialogProps {
    visible: boolean;
    weight: Weight;
    setWeight: (weight: Weight) => void;
    criterionOptions: CriterionOption[];
    setCriterionOptions: (options: CriterionOption[]) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, weight, setWeight, criterionOptions, setCriterionOptions, onSave, onHide } = props;
    const [activeStep, setActiveStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);

    const items = [
        { label: 'Weight Info' },
        { label: 'Options' }
    ];

    const nextStep = () => {
        setSubmitted(true);
        const result = validateWeight(weight);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        setErrorMessage(undefined);
        setActiveStep(1);
    };

    const prevStep = () => setActiveStep(0);

    const save = async () => {
        setSubmitted(true);
        const result = validateWeight(weight);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        setErrorMessage(undefined);
        setActiveStep(0);
        onSave();
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setActiveStep(0);
        onHide();
    };

    const footer = (
        <div className="flex justify-content-between">
            {activeStep > 0 && (
                <Button label="Back" icon="pi pi-angle-left" onClick={prevStep} text />
            )}
            {activeStep === 0 && (
                <Button label="Next" icon="pi pi-angle-right" onClick={nextStep} text />
            )}
            {activeStep === 1 && (
                <Button label="Save" icon="pi pi-check" onClick={save} text />
            )}
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '600px' }}
            header={weight._id ? 'Edit Criterion' : 'New Criterion'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            <Steps model={items} activeIndex={activeStep} readOnly className="mb-4" />
            {activeStep === 0 && <>
                <div className="field">
                    <label htmlFor="title">Criterion</label>
                    <InputText
                        id="title"
                        value={weight.title}
                        onChange={(e) => setWeight({ ...weight, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !weight.title })}
                    />
                </div>
                <div className="field">
                    <label htmlFor="weight_value">Weight</label>
                    <InputNumber
                        id="weight_value"
                        value={weight.weight_value}
                        onChange={(e) =>
                            setWeight({ ...weight, weight_value: e.value || 0 })
                        }
                        required
                        className={classNames({
                            'p-invalid': submitted && (weight.weight_value == null || weight.weight_value <= 0),
                        })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="type">Form</label>
                    <Dropdown
                        id="type"
                        value={weight.response_type}
                        options={Object.values(ResponseType).map(g => ({ label: g, value: g }))}
                        onChange={(e) =>
                            setWeight({ ...weight, response_type: e.value })
                        }
                        placeholder="Select Form"
                        className={classNames({ 'p-invalid': submitted && !weight.response_type })}
                    />
                </div>

            </>}
            {activeStep === 1 && weight.response_type === ResponseType.Closed && (
                <CriterionOptionComp
                    weight={weight}
                    criterionOptions={criterionOptions}
                    setCriterionOptions={setCriterionOptions}
                />
            )}

            {activeStep === 1 && weight.response_type === ResponseType.Open && (
                <div className="p-4 text-center text-muted">
                    <div><strong>{weight.title}</strong>({weight.weight_value})</div>
                    <div>is ready to create.</div>
                    <div>click save to create it.</div>
                </div>
            )}

            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
