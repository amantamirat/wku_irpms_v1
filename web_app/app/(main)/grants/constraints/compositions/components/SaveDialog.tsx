'use client';
import { accessibilityOptions, applicantUnits, genderOptions } from '@/app/(main)/applicants/models/applicant.model';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { ApplicantConstraintType, Constraint, isListConstraint, isRangeConstraint } from '../../models/constraint.model';
import { Composition, validateComposition } from '../models/composition.model';

interface SaveDialogProps {
    visible: boolean;
    composition: Composition;
    parent: Constraint;
    setComposition: (composition: Composition) => void;
    onSave: () => Promise<void>;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, composition, setComposition, onSave, onHide, parent } = props;
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    const save = async () => {
        try {
            setSubmitted(true);
            const result = validateComposition(composition);
            if (!result.valid) {
                throw new Error(result.message);
            }
            await onSave();
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Composition saved',
                life: 2000
            });
            setTimeout(() => hide(), 2000);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save composition',
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
            header={composition._id ? `Edit Composition` : `Create New Composition`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            <Toast ref={toast} />
            {isRangeConstraint(parent.constraint as ApplicantConstraintType) &&
                <>
                    <div className="field">
                        <label htmlFor="min">Minimum</label>
                        <InputNumber
                            id="min"
                            value={composition.min}
                            onChange={(e) => setComposition({ ...composition, min: e.value ?? 0 })}
                            required
                            className={classNames({ 'p-invalid': submitted && (composition.min == null) })}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="max">Maximum</label>
                        <InputNumber
                            id="max"
                            value={composition.max}
                            onChange={(e) => setComposition({ ...composition, max: e.value ?? 0 })}
                            required
                            className={classNames({ 'p-invalid': submitted && (composition.max == null) })}
                        />
                    </div>
                </>}
            {
                isListConstraint(parent.constraint as ApplicantConstraintType) &&
                <div className="field">
                    <label htmlFor="item">Item</label>
                    <Dropdown
                        id="item"
                        value={composition.item}
                        options={parent.constraint === ApplicantConstraintType.GENDER ? genderOptions :
                            parent.constraint === ApplicantConstraintType.ACCESSIBILITY ? accessibilityOptions : applicantUnits}
                        onChange={(e) => setComposition({ ...composition, item: e.value })}
                        placeholder="Select Item"

                    />
                </div>
            }

            <div className="field">
                <label htmlFor="value">Value</label>
                <InputNumber
                    id="value"
                    value={composition.value}
                    onChange={(e) => setComposition({ ...composition, value: e.value ?? 0 })}
                    required
                    className={classNames({ 'p-invalid': submitted && (composition.value == null) })}
                />
            </div>
        </Dialog>
    );
}

export default SaveDialog;
