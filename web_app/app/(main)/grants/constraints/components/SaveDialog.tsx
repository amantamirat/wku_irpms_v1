'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import {
    Constraint,
    ConstraintType,
    OperationMode,
    ProjectConstraintType,
    validateConstraint,
} from '../models/constraint.model';
import { ConstraintApi } from '../api/constraint.api';
import { ApplicantConstraintType } from '../models/applicant-constaint-type';

interface SaveDialogProps {
    visible: boolean;
    constraint: Constraint;
    onComplete?: (saved: Constraint) => void;
    onHide: () => void;
}

const SaveDialog = ({ visible, constraint, onComplete, onHide }: SaveDialogProps) => {
    const [localConstraint, setLocalConstraint] = useState<Constraint>({ ...constraint });
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    // Sync incoming prop changes
    useEffect(() => {
        setLocalConstraint({ ...constraint });
    }, [constraint]);


    const saveConstraint = async () => {
        setSubmitted(true);
        try {
            const validation = validateConstraint(localConstraint);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved = localConstraint._id
                ? await ConstraintApi.updateConstraint(localConstraint)
                : await ConstraintApi.createConstraint(localConstraint);
            saved = {
                ...saved,
                grant: localConstraint.grant
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Constraint saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save constraint',
                life: 2500,
            });
        } finally {
            setSubmitted(false);
        }
    };

    // Reset when dialog closed
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalConstraint({ ...constraint });
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveConstraint} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localConstraint._id ? 'Edit Constraint' : 'New Constraint'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Constraint Selector */}
                {!localConstraint._id && (
                    <div className="field">
                        <label htmlFor="constraint">Constraint</label>
                        <Dropdown
                            id="constraint"
                            value={localConstraint.constraint}
                            options={Object.values(
                                localConstraint.type === ConstraintType.PROJECT
                                    ? ProjectConstraintType
                                    : ApplicantConstraintType
                            ).map((c) => ({ label: c, value: c }))}
                            onChange={(e) =>
                                setLocalConstraint({ ...localConstraint, constraint: e.value })
                            }
                            placeholder="Select Constraint"
                            className={classNames({
                                'p-invalid': submitted && !localConstraint.constraint,
                            })}
                        />
                    </div>
                )}

                {/* Project Constraint Fields */}
                {localConstraint.type === ConstraintType.PROJECT && (
                    <>
                        <div className="field">
                            <label htmlFor="min">Minimum {localConstraint.constraint}</label>
                            <InputNumber
                                id="min"
                                value={localConstraint.min}
                                onChange={(e) =>
                                    setLocalConstraint({
                                        ...localConstraint,
                                        min: e.value ?? 0,
                                    })
                                }
                                required
                                className={classNames({
                                    'p-invalid':
                                        submitted &&
                                        (localConstraint.min == null ||
                                            localConstraint.min <= 0),
                                })}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="max">Maximum {localConstraint.constraint}</label>
                            <InputNumber
                                id="max"
                                value={localConstraint.max}
                                onChange={(e) =>
                                    setLocalConstraint({
                                        ...localConstraint,
                                        max: e.value ?? 0,
                                    })
                                }
                                required
                                className={classNames({
                                    'p-invalid':
                                        submitted &&
                                        (localConstraint.max == null ||
                                            localConstraint.max <= 0),
                                })}
                            />
                        </div>
                    </>
                )}

                {/* Applicant Mode Selector */}
                {localConstraint.type === ConstraintType.APPLICANT && (
                    <div className="field">
                        <label htmlFor="mode">Mode</label>
                        <Dropdown
                            id="mode"
                            value={localConstraint.mode}
                            options={Object.values(OperationMode).map((op) => ({
                                label: op,
                                value: op,
                            }))}
                            onChange={(e) =>
                                setLocalConstraint({
                                    ...localConstraint,
                                    mode: e.value,
                                })
                            }
                            placeholder="Select Mode"
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    !localConstraint.mode &&
                                    localConstraint.type === ConstraintType.APPLICANT,
                            })}
                        />
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SaveDialog;
