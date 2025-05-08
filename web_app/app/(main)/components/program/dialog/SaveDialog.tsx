'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Program, validateProgram, AcademicLevel, Classification } from '@/models/program';
import { Dropdown } from 'primereact/dropdown';

interface SaveDialogProps {
    visible: boolean;
    program: Program;
    setProgram: (program: Program) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, program, setProgram, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);

    const save = async () => {
        setSubmitted(true);
        if (!validateProgram(program)) {
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
            header={program._id ? 'Edit Program Details' : 'New Program Details'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            {program && (
                <>
                    <div className="field">
                        <label htmlFor="name">Program Name</label>
                        <InputText
                            id="name"
                            value={program.program_name}
                            onChange={(e) => setProgram({ ...program, program_name: e.target.value })}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !program.program_name })}
                        />
                        {submitted && !program.program_name && (
                            <small className="p-invalid">Program Name is required.</small>
                        )}
                    </div>
                    <div className="field">
                        <label htmlFor="academic_level">Academic Level</label>
                        <Dropdown
                            id="academic_level"
                            value={program.academic_level}
                            options={Object.values(AcademicLevel).map(level => ({ label: level, value: level }))}
                            onChange={(e) =>
                                setProgram({ ...program, academic_level: e.value })
                            }
                            placeholder="Select Academic Level"
                            className={classNames({ 'p-invalid': submitted && !program.academic_level })}
                        />
                        {submitted && !program.academic_level && (
                            <small className="p-invalid">Academic Level is required.</small>
                        )}
                    </div>

                    <div className="field">
                        <label htmlFor="classification">Classification</label>
                        <Dropdown
                            id="classification"
                            value={program.classification}
                            options={Object.values(Classification).map(level => ({ label: level, value: level }))}
                            onChange={(e) =>
                                setProgram({ ...program, classification: e.value })
                            }
                            placeholder="Select Classification"
                            className={classNames({ 'p-invalid': submitted && !program.classification })}
                        />
                        {submitted && !program.classification && (
                            <small className="p-invalid">Classification is required.</small>
                        )}
                    </div>
                </>

            )}
        </Dialog>
    );
}

export default SaveDialog;
