'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Specialization, validateSpecialization } from '@/models/specialization';
import { Dropdown } from 'primereact/dropdown';
import { AcademicLevel } from '@/models/program';

interface SaveDialogProps {
    visible: boolean;
    specialization: Specialization;
    setSpecialization: (specialization: Specialization) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, specialization, setSpecialization, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);

    const save = async () => {
        setSubmitted(true);
        if (!validateSpecialization(specialization)) {
            return;
        }
        onSave();
    }

    const hide = async () => {
        setSubmitted(false);
        onHide();
    }

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
            style={{ width: '450px' }}
            header={specialization._id ? 'Edit Specialization Details' : 'New Specialization Details'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            {specialization && (
                <>
                    <div className="field">
                        <label htmlFor="name">Specialization Name</label>
                        <InputText
                            id="name"
                            value={specialization.specialization_name}
                            onChange={(e) => setSpecialization({ ...specialization, specialization_name: e.target.value })}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !specialization.specialization_name })}
                        />
                        {submitted && !specialization.specialization_name && (
                            <small className="p-invalid">Specialization Name is required.</small>
                        )}
                    </div>
                    <div className="field">
                        <label htmlFor="academic_level">Academic Level</label>
                        <Dropdown
                            id="academic_level"
                            value={specialization.academic_level}
                            options={Object.values(AcademicLevel).map(level => ({ label: level, value: level }))}
                            onChange={(e) =>
                                setSpecialization({ ...specialization, academic_level: e.value })
                            }
                            placeholder="Select Academic Level"
                            className={classNames({ 'p-invalid': submitted && !specialization.academic_level })}
                        />
                        {submitted && !specialization.academic_level && (
                            <small className="p-invalid">Academic Level is required.</small>
                        )}
                    </div>
                </>

            )}
        </Dialog>
    );
}

export default SaveDialog;
