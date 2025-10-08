'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { ApplicantConstraintType, BaseConstraintType, Constraint, isListConstraint, isRangeConstraint, ProjectConstraintType, validateConstraint } from '../models/constraint.model';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { accessibilityOptions, genderOptions, scopeOptions } from '@/app/(main)/applicants/models/applicant.model';


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
            {constraint.type === BaseConstraintType.PROJECT && <>
                <div className="field">
                    <label htmlFor="min">Minimum {constraint.constraint}</label>
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
                    <label htmlFor="max">Maximum {constraint.constraint}</label>
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
            </>
            }

            {constraint.type === BaseConstraintType.APPLICANT &&
                <>
                    {isListConstraint(constraint.constraint as ApplicantConstraintType) &&
                        <div className="field">
                            <label htmlFor="values">Values</label>
                            <MultiSelect
                                id="values"
                                value={constraint.list || []}
                                options={constraint.constraint === ApplicantConstraintType.GENDER ? genderOptions :
                                    constraint.constraint === ApplicantConstraintType.ACCESSIBILITY ? accessibilityOptions : scopeOptions}
                                onChange={(e) => setConstraint({ ...constraint, list: e.value })}
                                placeholder="Select Values"
                                display="chip"
                            />
                        </div>
                    }
                    {isRangeConstraint(constraint.constraint as ApplicantConstraintType) &&
                        <>
                            <div className="field">
                                <label htmlFor="min">Minimum {constraint.constraint}</label>
                                <InputNumber
                                    id="min"
                                    value={constraint.range?.min}
                                    onChange={(e) =>
                                        setConstraint({
                                            ...constraint,
                                            range: {
                                                max: constraint.range?.max ?? 0,
                                                min: e.value || 0
                                            }
                                        })
                                    }
                                    required
                                    className={classNames({
                                        'p-invalid': submitted && (constraint.range?.min == null || constraint.range?.min <= 0),
                                    })}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="max">Maximum {constraint.constraint}</label>
                                <InputNumber
                                    id="max"
                                    value={constraint.range?.max}
                                    onChange={(e) =>
                                        setConstraint({
                                            ...constraint,
                                            range: {
                                                min: constraint.range?.min ?? 0,
                                                max: e.value || 0
                                            }
                                        })
                                    }
                                    required
                                    className={classNames({
                                        'p-invalid': submitted && (constraint.range?.max == null || constraint.range?.max <= 0),
                                    })}
                                />
                            </div>
                        </>
                    }
                </>
            }
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
