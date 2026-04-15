'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { ConstraintApi } from '../api/constraint.api';
import { Constraint, validateConstraint, ProjectConstraintType } from '../models/constraint.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { constraintUIMap } from '../models/constraint.config';

const SaveConstraint = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Constraint>) => {
    const [localConstraint, setLocalConstraint] = useState<Constraint>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    const uiConfig = constraintUIMap[localConstraint.constraint as ProjectConstraintType];

    useEffect(() => {
        setLocalConstraint({ ...item });
    }, [item]);

    const saveConstraint = async () => {
        setSubmitted(true);
        try {
            const validation = validateConstraint(localConstraint);
            if (!validation.valid) throw new Error(validation.message);

            const saved = localConstraint._id
                ? await ConstraintApi.update(localConstraint)
                : await ConstraintApi.create(localConstraint);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Constraint saved successfully',
                life: 1000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save constraint',
                life: 2000,
            });
        } finally {
            setSubmitted(false);
        }
    };

    const hide = () => {
        setSubmitted(false);
        onHide();
    };

    // Professional Dropdown Template
    const constraintOptionTemplate = (option: any) => {
        const config = constraintUIMap[option.value as ProjectConstraintType];
        return (
            <div className="flex align-items-center">
                <i className={`${config?.icon} mr-2`} />
                <span>{config?.label || option.label}</span>
            </div>
        );
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hide} severity="secondary" />
            <Button label="Save Constraint" icon="pi pi-check" onClick={saveConstraint} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={localConstraint._id ? 'Edit Constraint' : 'Define New Constraint'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                <div className="field mb-4">
                    <label htmlFor="constraint" className="font-bold">Constraint Type</label>
                    <Dropdown
                        id="constraint"
                        value={localConstraint.constraint}
                        options={Object.keys(constraintUIMap).map(key => ({ label: key, value: key }))}
                        itemTemplate={constraintOptionTemplate}
                        valueTemplate={constraintOptionTemplate}
                        onChange={(e) => setLocalConstraint({ ...localConstraint, constraint: e.value })}
                        placeholder="Select a constraint type"
                        className={classNames({ 'p-invalid': submitted && !localConstraint.constraint })}
                        disabled={!!localConstraint._id}
                    />
                </div>

                <div className="grid">
                    <div className="field col-6">
                        <label htmlFor="min" className="font-bold">Minimum</label>
                        <InputNumber
                            id="min"
                            value={localConstraint.min}
                            onValueChange={(e) => setLocalConstraint({ ...localConstraint, min: e.value ?? 0 })}
                            mode={localConstraint.constraint?.includes('BUDGET') ? 'currency' : 'decimal'}
                            currency="ETB"
                            locale="en-ET"
                        />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="max" className="font-bold">Maximum</label>
                        <InputNumber
                            id="max"
                            value={localConstraint.max}
                            onValueChange={(e) => setLocalConstraint({ ...localConstraint, max: e.value ?? 0 })}
                            mode={localConstraint.constraint?.includes('BUDGET') ? 'currency' : 'decimal'}
                            currency="ETB"
                            locale="en-ET"
                        />
                    </div>
                </div>

                {/* Live Preview - Makes it look very professional */}
                {uiConfig?.format && (
                    <div className="mt-2 p-3 border-round bg-gray-100 surface-ground text-sm">
                        <span className="text-500 mr-2">Preview:</span>
                        <span className="font-medium text-900">
                            {uiConfig.format(localConstraint.min, localConstraint.max)}
                        </span>
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SaveConstraint;