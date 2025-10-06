'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { Constraint, ProjectConstraintType, validateConstraint } from '../models/constraint.model';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { InputNumber } from 'primereact/inputnumber';


interface SaveDialogProps {
    visible: boolean;
    constraint: Constraint;
    setConstraint: (constraint: Constraint) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, constraint, setConstraint, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const save = async () => {
        setSubmitted(true);
        const result = validateConstraint(constraint);
        if (!result.valid) {
            setErrorMessage(result.message);
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
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);


    return (
        <Dialog
            visible={visible}
            style={{ width: '500px', height: '400px' }}
            header={constraint._id ? `Edit ${constraint.type} Constraint` : `Create New ${constraint.type} Constraint`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
            maximizable
        >
            <div className="field">
                <label htmlFor="constraint">Constraint</label>
                <Dropdown
                    id="constraint"
                    value={constraint.constarint}
                    options={Object.values(ProjectConstraintType).map(c => ({ label: c, value: c }))}
                    onChange={(e) =>
                        setConstraint({ ...constraint, constarint: e.value })
                    }
                    placeholder="Select Constarint"
                    className={classNames({ 'p-invalid': submitted && !constraint.constarint })}
                />
            </div>

            <div className="field">
                <label htmlFor="min">Minimum {constraint.constarint}</label>
                <InputNumber
                    id="min"
                    value={constraint.min}
                    onChange={(e) =>
                        setConstraint({ ...constraint, min: e.value || 0 })
                    }
                    required
                    className={classNames({
                        'p-invalid': submitted && (constraint.min == null || constraint.min <= 0),
                    })}
                />
            </div>

            <div className="field">
                <label htmlFor="max">Maximum {constraint.constarint}</label>
                <InputNumber
                    id="max"
                    value={constraint.max}
                    onChange={(e) =>
                        setConstraint({ ...constraint, max: e.value || 0 })
                    }
                    required
                    className={classNames({
                        'p-invalid': submitted && (constraint.max == null || constraint.max <= 0),
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
