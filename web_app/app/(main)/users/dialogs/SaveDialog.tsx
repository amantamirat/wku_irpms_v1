'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { User, validateUser } from '../models/user.model';
import { Role } from '../../roles/models/role.model';
import { RoleApi } from '../../roles/api/role.api';
import { UserApi } from '../api/UserService';

interface SaveUserDialogProps {
    visible: boolean;
    user: User;
    onHide: () => void;
    onComplete?: (savedUser: User) => void;
    changePassword?: boolean;
}

export default function SaveUserDialog({ visible, user, onHide, onComplete, changePassword }: SaveUserDialogProps) {
    const toast = useRef<Toast>(null);
    const [localUser, setLocalUser] = useState<User>({ ...user });
    const [roles, setRoles] = useState<Role[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
        setLocalUser({ ...user });
    }, [user]);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await RoleApi.getRoles();
                setRoles(data);
            } catch (err) {
                console.error("Failed to fetch roles:", err);
            }
        };
        fetchRoles();
    }, []);

    const saveUser = async () => {
        setSubmitted(true);
        const validation = validateUser(localUser);
        if (!validation.valid) {
            setErrorMessage(validation.message);
            return;
        }

        try {
            let saved: User;
            if (localUser._id) {
                saved = await UserApi.updateUser(localUser);
            } else {
                saved = await UserApi.createUser(localUser);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'User saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save user',
                detail: '' + err,
                life: 2000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveUser} />
        </>
    );

    const isEdit = !!localUser._id;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={isEdit ? 'Edit User' : 'New User'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field">
                    <label htmlFor="user_name">Username</label>
                    <InputText
                        id="user_name"
                        value={localUser.user_name}
                        onChange={(e) => setLocalUser({ ...localUser, user_name: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localUser.user_name })}
                        autoFocus
                    />
                    {submitted && !localUser.user_name && (
                        <small className="p-invalid">User Name is required.</small>
                    )}
                </div>

                {(!isEdit || (isEdit && changePassword)) && (
                    <>
                        <div className="field">
                            <label htmlFor="password">Password</label>
                            <Password
                                id="password"
                                value={localUser.password || ''}
                                onChange={(e) => setLocalUser({ ...localUser, password: e.target.value })}
                                toggleMask
                                className={classNames({ 'p-invalid': submitted && !localUser.password })}
                            />
                            {submitted && !localUser.password && (
                                <small className="p-invalid">Password is required.</small>
                            )}
                        </div>
                        <div className="field">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <Password
                                id="confirmPassword"
                                value={localUser.confirmed_password || ''}
                                onChange={(e) => setLocalUser({ ...localUser, confirmed_password: e.target.value })}
                                toggleMask
                                className={classNames({ 'p-invalid': submitted && !localUser.confirmed_password })}
                            />
                            {submitted && !localUser.confirmed_password && (
                                <small className="p-invalid">Password confirmation is required.</small>
                            )}
                        </div>
                    </>
                )}

                <div className="field">
                    <label htmlFor="email">Email</label>
                    <InputText
                        id="email"
                        type="email"
                        value={localUser.email}
                        disabled={isEdit}
                        onChange={(e) => setLocalUser({ ...localUser, email: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localUser.email })}
                    />
                    {submitted && !localUser.email && (
                        <small className="p-invalid">Email is required.</small>
                    )}
                </div>

                <div className="field">
                    <label htmlFor="roles">Roles</label>
                    <MultiSelect
                        id="roles"
                        value={localUser.roles}
                        options={roles}
                        optionLabel="role_name"
                        onChange={(e) => setLocalUser({ ...localUser, roles: e.value })}
                        placeholder="Select Roles"
                        display="chip"
                        className={classNames({ 'p-invalid': submitted && !localUser.roles?.length })}
                    />
                </div>

                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
}
