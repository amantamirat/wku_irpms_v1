import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { ChangePasswordDTO } from '@/app/(full-page)/auth/dto/auth.dto';
import { AuthApi } from '@/app/(full-page)/auth/api/auth.service';
import { Divider } from 'primereact/divider';


interface ChangePasswordDialogProps {
    visible: boolean;
    onHide: () => void;
    onSuccess?: () => void;
    toast?: any; // Pass a ref to your PrimeReact Toast
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
    visible,
    onHide,
    onSuccess,
    toast
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ChangePasswordDTO>({
        currentPassword: '',
        password: ''
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);


    const isFormInvalid =
        !formData.currentPassword ||
        !formData.password ||
        formData.password !== confirmPassword ||
        formData.password.length < 6;

    const handleHide = () => {
        setFormData({ currentPassword: '', password: '' });
        setConfirmPassword('');
        setError(null);
        onHide();
    };

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);

        try {
            await AuthApi.changePassword(formData);
            const detail = 'Password updated successfully';

            // 1. Try to show Toast if provided
            if (toast?.current) {
                toast.current.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: detail,
                    life: 3000
                });
                // Auto-hide dialog only if toast is handling the feedback
                onSuccess?.();
                handleHide();
            } else {
                // 2. Fallback: Show inline message and stay open for a second so they can read it
                setSuccessMessage(detail);
                onSuccess?.();
                setTimeout(() => handleHide(), 2000);
            }

        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to update password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={handleHide} disabled={loading} />
            <Button
                label="Update Password"
                icon="pi pi-check"
                loading={loading}
                onClick={handleSubmit}
                disabled={isFormInvalid}
            />
        </div>
    );

    return (
        <Dialog
            header="Security Settings"
            visible={visible}
            style={{ width: '400px' }}
            breakpoints={{ '960px': '75vw', '641px': '90vw' }}
            modal
            footer={footer}
            onHide={handleHide}
        >
            <div className="flex flex-column gap-4 py-2">
                <div className="flex flex-column gap-2">
                    <label htmlFor="current" className="font-bold text-sm">Current Password</label>
                    <Password
                        id="current"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        toggleMask
                        feedback={false}
                        className="w-full"
                        inputClassName="w-full"
                    />
                </div>

                <Divider align="center" className="my-0">
                    <span className="text-sm text-color-secondary">New Credentials</span>
                </Divider>

                <div className="flex flex-column gap-2">
                    <label htmlFor="new" className="font-bold text-sm">New Password</label>
                    <Password
                        id="new"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        toggleMask
                        className="w-full"
                        inputClassName="w-full"
                        promptLabel="Choose a strong password"
                    />
                </div>

                <div className="flex flex-column gap-2">
                    <label htmlFor="confirm" className="font-bold text-sm">Confirm New Password</label>
                    <Password
                        id="confirm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        toggleMask
                        feedback={false}
                        className="w-full"
                        inputClassName={classNames('w-full', { 'p-invalid': confirmPassword && formData.password !== confirmPassword })}
                    />
                    {confirmPassword && formData.password !== confirmPassword && (
                        <small className="p-error">Passwords do not match.</small>
                    )}
                </div>

                {/* Dynamic Feedback Area */}
                {error && (
                    <Message
                        severity="error"
                        text={error}
                        className="w-full justify-content-start"
                    />
                )}

                {successMessage && (
                    <Message
                        severity="success"
                        text={successMessage}
                        className="w-full justify-content-start"
                    />
                )}
            </div>
        </Dialog>
    );
};

export default ChangePasswordDialog;