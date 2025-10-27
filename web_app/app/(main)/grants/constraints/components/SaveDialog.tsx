'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { ApplicantConstraintType, BaseConstraintType, Constraint, OperationMode, ProjectConstraintType, validateConstraint } from '../models/constraint.model';


interface SaveDialogProps {
    visible: boolean;
    constraint: Constraint;
    setConstraint: (constraint: Constraint) => void;
    onSave: () => Promise<void>;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, constraint, setConstraint, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    const save = async () => {
        try {
            setSubmitted(true);
            const result = validateConstraint(constraint);
            if (!result.valid) {
                throw new Error(result.message);
            }
            await onSave();

            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Constraint saved',
                life: 2000
            });
            setTimeout(() => hide(), 2000);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save constraint',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setSubmitted(false);
        }
    };

    const hide = () => {
        setSubmitted(false);
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
        }
    }, [visible]);


    return (
        <Dialog
            visible={visible}
            style={{ width: '500px' }}
            header={constraint._id ? `Edit Constraint` : `Create New Constraint`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            <Toast ref={toast} />
            {!constraint._id && 
                <div className="field">
                    <label htmlFor="constraint">Constraint</label>
                    <Dropdown
                        id="constraint"
                        value={constraint.constraint}
                        options={Object.values(
                            constraint.type === BaseConstraintType.PROJECT
                                ? ProjectConstraintType
                                : ApplicantConstraintType
                        ).map(c => ({ label: c, value: c }))}
                        onChange={(e) =>
                            setConstraint({ ...constraint, constraint: e.value })
                        }
                        placeholder="Select Constarint"
                        className={classNames({ 'p-invalid': submitted && !constraint.constraint })}
                    />
                </div>
            }

            {(
                constraint.type === BaseConstraintType.PROJECT 
            ) && (
                    <>
                        <div className="field">
                            <label htmlFor="min">Minimum {constraint.constraint}</label>
                            <InputNumber
                                id="min"
                                value={constraint.min}
                                onChange={(e) => setConstraint({ ...constraint, min: e.value || 0 })}
                                required
                                className={classNames({
                                    'p-invalid': submitted && (constraint.min == null || constraint.min <= 0),
                                })}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="max">Maximum {constraint.constraint}</label>
                            <InputNumber
                                id="max"
                                value={constraint.max}
                                onChange={(e) => setConstraint({ ...constraint, max: e.value || 0 })}
                                required
                                className={classNames({
                                    'p-invalid': submitted && (constraint.max == null || constraint.max <= 0),
                                })}
                            />
                        </div>
                    </>
                )}

           

            {
                constraint.type === BaseConstraintType.APPLICANT &&
                <div className="field">
                    <label htmlFor="mode">Mode</label>
                    <Dropdown
                        id="mode"
                        value={constraint.mode}
                        options={Object.values(OperationMode).map(op => ({ label: op, value: op }))}
                        onChange={(e) =>
                            setConstraint({ ...constraint, mode: e.value })
                        }
                        placeholder="Select Mode"
                        className={classNames({ 'p-invalid': submitted && !constraint.mode && constraint.type === BaseConstraintType.APPLICANT })}
                    />
                </div>
            }
            
        </Dialog >
    );
}

export default SaveDialog;
