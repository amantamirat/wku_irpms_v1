'use client';

import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { User, validateUser } from '../models/user.model';
import { Role } from '@/models/role';
import { MultiSelect } from 'primereact/multiselect';


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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | undefined>();


    const passwordMismatch = user.password !== confirmPassword;

    const save = async () => {
        setSubmitted(true);
        const result = validateUser(user);
        if (!result.valid || (!user._id && passwordMismatch)) {
            setErrorMessage(result.message);
            return;
        }
        setErrorMessage(undefined);
        onSave();
    }

    const hide = async () => {
        setSubmitted(false);
        setConfirmPassword('');
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
        //position={user._id ? 'right' : 'center'}
        >
            {user && (
                <>
                    <div className="field">
                        <label htmlFor="user_name">User Name</label>
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

                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <InputText
                            id="email"
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

                    {!user._id && (
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
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    feedback={true}
                                    promptLabel="Confirm a password"
                                    weakLabel="Weak"
                                    mediumLabel="Medium"
                                    strongLabel="Strong"
                                    toggleMask
                                    className={classNames({ 'p-invalid': submitted && passwordMismatch })}
                                />
                                {submitted && passwordMismatch && (
                                    <small className="p-invalid">Passwords do not match.</small>
                                )}
                            </div>
                        </>
                    )}


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
