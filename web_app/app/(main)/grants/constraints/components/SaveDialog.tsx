'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useRef, useState } from 'react';
import { ApplicantConstraintType, BaseConstraintType, Constraint, isListConstraint, isRangeConstraint, OperationMode, ProjectConstraintType, validateConstraint } from '../models/constraint.model';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { accessibilityOptions, genderOptions, scopeOptions } from '@/app/(main)/applicants/models/applicant.model';


interface SaveDialogProps {
    visible: boolean;
    constraint: Constraint;
    parent?: Constraint;
    setConstraint: (constraint: Constraint) => void;
    onSave: () => Promise<void>;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, constraint, setConstraint, onSave, onHide, parent } = props;
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
            {!constraint._id && (constraint.type !== BaseConstraintType.COMPOSITION) &&
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
                constraint.type === BaseConstraintType.PROJECT ||
                (parent && isRangeConstraint(parent.constraint as ApplicantConstraintType))
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
                parent && isListConstraint(parent.constraint as ApplicantConstraintType) &&
                <>
                    <div className="field">
                        <label htmlFor="item">Item</label>
                        <Dropdown
                            id="item"
                            value={constraint.item}
                            options={parent.constraint === ApplicantConstraintType.GENDER ? genderOptions :
                                parent.constraint === ApplicantConstraintType.ACCESSIBILITY ? accessibilityOptions : scopeOptions}
                            onChange={(e) => setConstraint({ ...constraint, item: e.value })}
                            placeholder="Select Item"

                        />
                    </div>
                </>

            }

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
            {
                parent &&
                <div className="field">
                    <label htmlFor="value">{parent.mode} Value</label>
                    <InputNumber
                        id="value"
                        value={constraint.value}
                        onChange={(e) => {
                            let val = e.value ?? 0;
                            if (parent.mode === "COUNT") {
                                val = Math.max(0, Math.floor(val)); // only positive integers
                            } else if (parent.mode === "RATIO") {
                                val = Math.min(1, Math.max(0, parseFloat(val.toFixed(2)))); // clamp between 0 and 1
                            }
                            setConstraint({ ...constraint, value: val });
                        }}
                        min={parent.mode === OperationMode.RATIO ? 0 : 1}
                        max={parent.mode === OperationMode.RATIO ? 1 : undefined}
                        step={parent.mode === OperationMode.RATIO ? 0.01 : 1}
                        useGrouping={false} 
                        maxFractionDigits={parent.mode === OperationMode.RATIO ? 2 : 0}
                        required
                        className={classNames({
                            'p-invalid': submitted && (constraint.value == null) && constraint.type === BaseConstraintType.COMPOSITION
                        })}
                    />
                </div>
            }
        </Dialog >
    );
}

export default SaveDialog;
