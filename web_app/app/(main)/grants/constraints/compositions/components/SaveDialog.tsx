'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { Composition, validateComposition } from '../models/composition.model';
import { accessibilityOptions, applicantUnits, genderOptions } from '@/app/(main)/applicants/models/applicant.model';
import { CompositionApi } from '../api/composition.api';
import { ApplicantConstraintType, isRangeConstraint, isListConstraint, getListOptions } from '../../models/applicant-constaint-type';
import { Constraint } from '../../models/constraint.model';

interface SaveDialogProps {
    visible: boolean;
    composition: Composition;
    onComplete?: (saved: Composition) => void;
    parent: Constraint;
    onHide: () => void;
}

const SaveDialog = ({ visible, composition, onComplete, onHide, parent }: SaveDialogProps) => {
    const [itemOptions, setItemOptions] = useState<any[] | null>();
    const [localComposition, setLocalComposition] = useState<Composition>({ ...composition });
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    // Sync prop changes
    useEffect(() => {
        setLocalComposition({ ...composition });
    }, [composition]);

    useEffect(() => {
        const options = getListOptions(parent.constraint as ApplicantConstraintType);
        setItemOptions(options);
    }, [parent]);


    const saveComposition = async () => {
        setSubmitted(true);
        try {
            const validation = validateComposition(localComposition);
            if (!validation.valid) throw new Error(validation.message);

            let saved = localComposition._id
                ? await CompositionApi.updateComposition(localComposition)
                : await CompositionApi.createComposition(localComposition);
            saved = {
                ...saved,
                constraint: localComposition.constraint
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Composition saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save composition',
                life: 2000,
            });
        } finally {
            setSubmitted(false);
        }
    };

    // Reset when dialog closes
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalComposition({ ...composition });
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveComposition} />
        </>
    );



    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localComposition._id ? 'Edit Composition' : 'New Composition'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Range constraints */}
                {isRangeConstraint(parent.constraint as ApplicantConstraintType) && (
                    <>
                        <div className="field">
                            <label htmlFor="min">Minimum ({parent.constraint})</label>
                            <InputNumber
                                id="min"
                                value={localComposition.min}
                                onChange={(e) => setLocalComposition({ ...localComposition, min: e.value ?? 0 })}
                                required
                                className={classNames({ 'p-invalid': submitted && localComposition.min == null })}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="max">Maximum ({parent.constraint})</label>
                            <InputNumber
                                id="max"
                                value={localComposition.max}
                                onChange={(e) => setLocalComposition({ ...localComposition, max: e.value ?? 0 })}
                                required
                                className={classNames({ 'p-invalid': submitted && localComposition.max == null })}
                            />
                        </div>
                    </>
                )}

                {/* List constraints */}
                {isListConstraint(parent.constraint as ApplicantConstraintType) && (
                    <div className="field">
                        <label htmlFor="item">Item ({parent.constraint})</label>
                        <Dropdown
                            id="item"
                            value={localComposition.item}
                            options={itemOptions?.map(o => ({
                                label: o,
                                value: o
                            }))}
                            onChange={(e) => setLocalComposition({ ...localComposition, item: e.value })}
                            placeholder="Select Item"
                            className={classNames({ 'p-invalid': submitted && !localComposition.item })}
                        />
                    </div>
                )}

                {/* Value field */}
                <div className="field">
                    <label htmlFor="value">Value ({parent.mode})</label>
                    <InputNumber
                        id="value"
                        value={localComposition.value}
                        onChange={(e) => setLocalComposition({ ...localComposition, value: e.value ?? 0 })}
                        required
                        className={classNames({ 'p-invalid': submitted && localComposition.value == null })}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveDialog;
