'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { User, validateUser } from '../models/user.model';


interface LinkDialogProps {
    visible: boolean;
    user: User;
    onChange: (user: User) => void;
    onSave: () => void;
    onHide: () => void;
}

function LinkDialog(props: LinkDialogProps) {
    const { visible, user, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();



    const save = async () => {
        setSubmitted(true);
        const result = validateUser(user);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        onSave();
    }

    const hide = async () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        onHide();
    }

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Link" icon="pi pi-check" text onClick={save} />
        </>
    );


    return (
        <Dialog
            visible={visible}
            style={{ width: '450px' }}
            header={'Link User Account'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            {user._id && (
                <>
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <InputText
                            id="email"
                            type="email"
                            value={user.email}
                            onChange={(e) => onChange({ ...user, email: e.target.value })}
                            className={classNames({
                                'p-invalid': submitted && (!user.email),
                            })}
                        />
                        {submitted && !user.email && (
                            <small className="p-invalid">Email is required.</small>
                        )}
                    </div>
                </>
            )}
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default LinkDialog;
