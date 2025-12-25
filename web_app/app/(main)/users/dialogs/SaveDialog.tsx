'use client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { UserApi } from '../api/UserService';
import { User, validateUser } from '../models/user.model';


interface SaveUserDialogProps {
    visible: boolean;
    user: User;
    enableCurrentPassword: boolean,
    onHide: () => void;
    onComplete?: (savedUser: User) => void;
}

const SaveUserDialog = ({ visible, user, enableCurrentPassword, onHide, onComplete }: SaveUserDialogProps) => {
    const toast = useRef<Toast>(null);
    const [localUser, setLocalUser] = useState<User>({ ...user });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    //const { hasPermission } = useAuth();
    // const readOrganization = hasPermission([PERMISSIONS.ORGANIAZTION.READ]);

    useEffect(() => {
        setLocalUser({ ...user });
    }, [user]);

    const saveUser = async () => {
        try {
            setSubmitted(true);
            const validation = validateUser(localUser, enableCurrentPassword);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved: User;
            if (localUser._id) {
                if (enableCurrentPassword) {
                    saved = await UserApi.changePassword(localUser);
                }
                else {
                    saved = await UserApi.update(localUser._id, localUser);
                }
                saved = {
                    ...saved,
                    applicant: localUser.applicant,
                };
            } else {
                saved = await UserApi.create(localUser);
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

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalUser({ ...user });
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
                header={isEdit ? 'Edit Credential' : 'New Credential'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
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
                {enableCurrentPassword &&
                    <div className="field">
                        <label htmlFor="currentPassword">Current Password</label>
                        <Password
                            id="currentPassword"
                            value={localUser.currentPassword || ''}
                            onChange={(e) => setLocalUser({ ...localUser, currentPassword: e.target.value })}
                            toggleMask
                            className={classNames({ 'p-invalid': submitted && !localUser.currentPassword })}
                        />
                        {submitted && !localUser.currentPassword && (
                            <small className="p-invalid">Current Password is required.</small>
                        )}
                    </div>
                }

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
                        value={localUser.confirmedPassword || ''}
                        onChange={(e) => setLocalUser({ ...localUser, confirmedPassword: e.target.value })}
                        toggleMask
                        className={classNames({ 'p-invalid': submitted && !localUser.confirmedPassword })}
                    />
                    {submitted && !localUser.confirmedPassword && (
                        <small className="p-invalid">Password confirmation is required.</small>
                    )}
                </div>

                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
}

export default SaveUserDialog;