'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { PasswordType, validatePassword } from '../models/user.model';
import { UserApi } from '../api/UserService';

interface ChangePasswordDialogProps {
    visible: boolean;
    id: string;
    reset?: boolean; // if true, admin reset mode
    onHide: () => void;
    onComplete?: () => void;
}

const ChangePasswordDialog = ({ visible, id, reset = false, onHide, onComplete }: ChangePasswordDialogProps) => {

    let emptyPassword: PasswordType = {
        _id: id,
    };

    const toast = useRef<Toast>(null);
    const [form, setForm] = useState<PasswordType>(emptyPassword);
    const [submitted, setSubmitted] = useState(false);
   

    const handleSave = async () => {
        try {
            setSubmitted(true);
            // Validation
            if (!reset && !form.oldPassword) {
                throw new Error('Old password is required.');
            }
            const validation = validatePassword(form);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            // Call API
            if (reset) {
                await UserApi.resetPassword(form);
            } else {
                await UserApi.changePassword(form);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: reset ? 'Password reset successfully' : 'Password changed successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(onComplete, 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to change password',
                life: 3000,
            });
        }
    };

    const clearForm = () => {
        setSubmitted(false);
        setForm({ ...emptyPassword });
    };

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={handleSave} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={reset ? 'Reset Password' : 'Change Password'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {!reset && (
                    <div className="field">
                        <label htmlFor="oldPassword">Old Password</label>
                        <Password
                            id="oldPassword"
                            value={form.oldPassword || ''}
                            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                            toggleMask
                            className={classNames({ 'p-invalid': submitted && !form.oldPassword })}
                        />
                        {submitted && !form.oldPassword && (
                            <small className="p-invalid">Old password is required.</small>
                        )}
                    </div>
                )}

                <div className="field">
                    <label htmlFor="newPassword">New Password</label>
                    <Password
                        id="newPassword"
                        value={form.newPassword || ''}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        toggleMask
                        className={classNames({ 'p-invalid': submitted && !form.newPassword })}
                    />
                    {submitted && !form.newPassword && (
                        <small className="p-invalid">New password is required.</small>
                    )}
                </div>

                <div className="field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <Password
                        id="confirmPassword"
                        value={form.confirmPassword || ''}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        toggleMask
                        className={classNames({ 'p-invalid': submitted && form.newPassword !== form.confirmPassword })}
                    />
                    {submitted && form.newPassword !== form.confirmPassword && (
                        <small className="p-invalid">Passwords do not match.</small>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default ChangePasswordDialog;
