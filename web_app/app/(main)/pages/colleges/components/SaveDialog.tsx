'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { College } from '@/models/college';

interface SaveDialogProps {
    visible: boolean;
    college: College;
    submitted: boolean;
    onChange: (college: College) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, college, submitted, onChange, onSave, onHide } = props;

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={onSave} />
        </>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: '450px' }}
            header={college._id ? 'Edit College Details' : 'New College Details'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={onHide}
            position={college._id ? 'right' : 'center'}
        >
            {college && (
                <div className="field">
                    <label htmlFor="name">College Name</label>
                    <InputText
                        id="name"
                        value={college.college_name}
                        onChange={(e) => onChange({ ...college, college_name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !college.college_name })}
                    />
                    {submitted && !college.college_name && (
                        <small className="p-invalid">College Name is required.</small>
                    )}
                </div>
            )}
        </Dialog>
    );
}

export default SaveDialog;
