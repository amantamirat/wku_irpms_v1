'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Directorate, validateDirectorate } from '@/models/directorate';

interface SaveDialogProps {
    visible: boolean;
    directorate: Directorate;
    onChange: (directorate: Directorate) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, directorate, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);

    const save = async () => {
        setSubmitted(true);
        if (!validateDirectorate(directorate)) {
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

    return (
        <Dialog
            visible={visible}
            style={{ width: '450px' }}
            header={directorate._id ? 'Edit Directorate Details' : 'New Directorate Details'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        //position={directorate._id ? 'right' : 'center'}
        >
            {directorate && (
                <div className="field">
                    <label htmlFor="name">Directorate Name</label>
                    <InputText
                        id="name"
                        value={directorate.directorate_name}
                        onChange={(e) => onChange({ ...directorate, directorate_name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !directorate.directorate_name })}
                    />
                    {submitted && !directorate.directorate_name && (
                        <small className="p-invalid">Directorate Name is required.</small>
                    )}
                </div>
            )}
        </Dialog>
    );
}

export default SaveDialog;
