'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { Specialization, validateSpecialization } from '../models/specialization.model';
import { SpecializationApi } from '../api/specialization.api';
import { InputText } from 'primereact/inputtext';
import { AcademicLevel } from '../../organizations/models/organization.model';
import { Dropdown } from 'primereact/dropdown';

interface SaveSpecializationDialogProps {
    visible: boolean;
    specialization: Specialization;
    onHide: () => void;
    onComplete?: (savedSpecialization: Specialization) => void;
}

const SaveSpecializationDialog = ({ visible, specialization, onHide, onComplete }: SaveSpecializationDialogProps) => {
    const toast = useRef<Toast>(null);
    const [localSpecialization, setLocalSpecialization] = useState<Specialization>({ ...specialization });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
        setLocalSpecialization({ ...specialization });
    }, [specialization]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalSpecialization({ ...specialization });
    };

    const saveSpecialization = async () => {
        try {
            setSubmitted(true);
            const validation = validateSpecialization(localSpecialization);
            if (!validation.valid) throw new Error(validation.message);
            let saved: Specialization;
            if (localSpecialization._id) {
                saved = await SpecializationApi.updateSpecialization(localSpecialization);
            } else {
                saved = await SpecializationApi.createSpecialization(localSpecialization);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Specialization saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save specialization',
                detail: err.message || 'Error occurred',
                life: 3000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveSpecialization} />
        </>
    );

    const isEdit = !!localSpecialization._id;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={isEdit ? 'Edit Academic Specialization' : 'New Academic Specialization'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field">
                    <label htmlFor="name">Name</label>
                    <InputText
                        id="name"
                        value={localSpecialization.name}
                        onChange={(e) => setLocalSpecialization({ ...localSpecialization, name: e.target.value })}
                        required
                        className={classNames({ 'p-invalid': submitted && !localSpecialization.name })}
                    />
                </div>
                <div className="field">
                    <label htmlFor="academicLevel">Academic Level</label>
                    <Dropdown
                        id="academicLevel"
                        value={localSpecialization.academicLevel}
                        options={Object.values(AcademicLevel).map(level => ({ label: level, value: level }))}
                        onChange={(e) => setLocalSpecialization({ ...localSpecialization, academicLevel: e.value })}
                        placeholder="Select Ac. Level"
                        className={classNames({ 'p-invalid': submitted && !localSpecialization.academicLevel })}
                    />
                    {submitted && !localSpecialization.academicLevel && (
                        <small className="p-invalid">Ac. Level is required.</small>
                    )}
                </div>
                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
};

export default SaveSpecializationDialog;
