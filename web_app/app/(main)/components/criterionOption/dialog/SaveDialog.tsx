'use client';

import { CriterionOption, validateCriterionOption } from '@/models/evaluation/criterionOption';
import { Weight } from '@/models/evaluation/weight';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';

interface SaveDialogProps {
    visible: boolean;
    criterionOption: CriterionOption;
    onChange: (criterionOption: CriterionOption) => void;
    criterionOptions: CriterionOption[];
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, criterionOption, onChange, criterionOptions, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const save = async () => {
        setSubmitted(true);
        const result = validateCriterionOption(criterionOption);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        const valid = validateOptions(criterionOptions, criterionOption);
        if (!valid.valid) {
            setErrorMessage(valid.message);
            return;
        }
        setErrorMessage(undefined);
        onSave();
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label={criterionOption._id ? 'Edit' : 'Add'} icon={criterionOption._id ? 'pi pi-check' : 'pi pi-plus'} text onClick={save} />
        </>
    );

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);


    const validateOptions = (
        criterionOptions: CriterionOption[],
        newOption: CriterionOption
    ): { valid: boolean; message?: string } => {
        const labelExists = criterionOptions.some(option => option.label === newOption.label);
        if (labelExists) {
            return { valid: false, message: "Duplicate found in: label" };
        }

        const valueExists = criterionOptions.some(option => option.value === newOption.value);
        if (valueExists) {
            return { valid: false, message: "Duplicate found in: value" };
        }

        return { valid: true };
    };


    return (
        <Dialog
            visible={visible}
            style={{ width: '400px' }}
            header={criterionOption._id ? 'Edit Option' : 'Add Option'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            <div className="field">
                <label htmlFor="label">Label</label>
                <InputText
                    id="label"
                    value={criterionOption.label}
                    onChange={(e) => onChange({ ...criterionOption, label: e.target.value })}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !criterionOption.label })}
                />
            </div>

            <div className="field">
                <label htmlFor="value">Value</label>
                <InputNumber
                    id="value"
                    value={criterionOption.value}
                    onChange={(e) =>
                        onChange({
                            ...criterionOption, value: e.value || 0,
                        })
                    }
                    max={(criterionOption.weight as Weight).weight_value}
                    required
                    className={classNames({
                        'p-invalid': submitted && (criterionOption.value == null || criterionOption.value <= 0),
                    })}
                />
            </div>
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
