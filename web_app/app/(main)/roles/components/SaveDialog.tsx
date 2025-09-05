'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';
import { Role, validateRole } from '../models/role.model';

interface SaveDialogProps {
    visible: boolean;
    role: Role;
    onChange: (role: Role) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, role, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const save = async () => {
        setSubmitted(true);
        const result = validateRole(role);
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
            style={{ width: '500px' }}
            header={role._id ? 'Edit Role' : 'New Role'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >

            <div className="field">
                <label htmlFor="name">Role Name</label>
                <InputText
                    id="name"
                    value={role.role_name}
                    onChange={(e) => onChange({ ...role, role_name: e.target.value })}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !role.role_name })}
                />
                {submitted && !role.role_name && (
                    <small className="p-invalid">Name is required.</small>
                )}
            </div>
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
