'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { User, validateUser } from '../models/user.model';
import { MultiSelect } from 'primereact/multiselect';
import { Role } from '../../roles/models/role.model';


interface SaveDialogProps {
    visible: boolean;
    user: User;
    onChange: (user: User) => void;
    roles: Role[];
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, user, roles, onChange, onSave, onHide } = props;
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
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );


    return (
        <Dialog
            visible={visible}
            style={{ width: '450px' }}
            header={user._id ? 'Edit User Details' : 'New User Details'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            {user && (
                <>
                    <div className="field">
                        <label htmlFor="user_name">Username</label>
                        <InputText
                            id="user_name"
                            value={user.user_name}
                            onChange={(e) => onChange({ ...user, user_name: e.target.value })}
                            className={classNames({ 'p-invalid': submitted && !user.user_name })}
                            autoFocus
                        />
                        {submitted && !user.user_name && (
                            <small className="p-invalid">User Name is required.</small>
                        )}
                    </div>


                    <>
                        <div className="field">
                            <label htmlFor="password">Password</label>
                            <Password
                                id="password"
                                value={user.password || ''}
                                onChange={(e) => onChange({ ...user, password: e.target.value })}
                                promptLabel="Enter a password"
                                feedback={false}
                                toggleMask
                                className={classNames({ 'p-invalid': submitted && !user.password })}
                            />
                            {submitted && !user.password && (
                                <small className="p-invalid">Password is required.</small>
                            )}
                        </div>

                        <div className="field">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <Password
                                id="confirmPassword"
                                value={user.confirmed_password || ''}
                                onChange={(e) => onChange({ ...user, confirmed_password: e.target.value })}
                                feedback={true}
                                promptLabel="Confirm a password"
                                weakLabel="Weak"
                                mediumLabel="Medium"
                                strongLabel="Strong"
                                toggleMask
                                className={classNames({ 'p-invalid': submitted && !user.confirmed_password })}
                            />
                            {submitted && !user.confirmed_password && (
                                <small className="p-invalid">Password confirmation is required.</small>
                            )}
                        </div>
                    </>

                    <div className="field">
                        <label htmlFor="roles">Roles</label>
                        <MultiSelect
                            id="roles"
                            value={roles.filter(r => user.roles?.some(ur => ur._id === r._id))}
                            options={roles}
                            optionLabel='role_name'
                            onChange={(e) => onChange({ ...user, roles: e.value })}
                            placeholder="Select Roles"
                            display="chip"
                            className={classNames({ 'p-invalid': submitted && !user.roles?.length })}
                        />
                    </div>
                </>
            )}
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
