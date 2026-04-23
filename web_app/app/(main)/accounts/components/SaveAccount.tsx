'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { Message } from 'primereact/message';

import { AccountApi } from '../api/account.api';
import { Account, validateAccount } from '../models/account.model';
import { UserApi } from '../../users/api/user.api';
import { User } from '../../users/models/user.model';

interface EntitySaveDialogProps<T> {
    visible: boolean;
    item: T;
    onHide: () => void;
    onComplete?: (savedItem: T) => void;
}

const SaveAccount = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Account>) => {
    const toast = useRef<Toast>(null);
    const [localUser, setLocalUser] = useState<Partial<Account>>({});
    const [applicants, setApplicants] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isEdit = !!item._id;

    // Reset and sync state when dialog opens
    useEffect(() => {
        if (visible) {
            setLocalUser({ ...item });
            fetchApplicants();
        } else {
            setSubmitted(false);
            setErrorMessage(null);
        }
    }, [visible, item]);

    const fetchApplicants = async () => {
        try {
            const data = await UserApi.getAll({});
            setApplicants(data);
        } catch (err) {
            console.error('Failed to fetch applicants');
        }
    };

    const handleSave = async () => {
        setSubmitted(true);
        setErrorMessage(null);

        // Professional Validation: Only require passwords if NEW account 
        // or if the user started typing in the password field
        const needsPassword = !isEdit || !!localUser.password;
        const validation = validateAccount(localUser as Account, !needsPassword);

        if (!validation.valid) {
            setErrorMessage(validation.message ?? "");
            return;
        }

        setLoading(true);
        try {
            const saved = isEdit
                ? await AccountApi.update(localUser as Account)
                : await AccountApi.create(localUser as Account);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Account credentials saved' });

            // Short delay for the toast to be seen before closing
            setTimeout(() => {
                onComplete?.({ ...saved, applicant: localUser.applicant });
                onHide();
            }, 600);
        } catch (err: any) {
            setErrorMessage(err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} disabled={loading} />
            <Button label={isEdit ? "Update Account" : "Create Account"}
                icon="pi pi-check"
                onClick={handleSave}
                loading={loading} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className={`pi ${isEdit ? 'pi-pencil' : 'pi-user-plus'} text-primary`}></i>
                        <span>{isEdit ? 'Update Credentials' : 'Create New Account'}</span>
                    </div>
                }
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {errorMessage && (
                    <Message severity="error" text={errorMessage} className="w-full mb-3" />
                )}

                <div className="field">
                    <label className="font-bold small mb-2 block">Link to Applicant</label>
                    <Dropdown
                        value={localUser.applicant}
                        options={applicants}
                        optionLabel="name"
                        dataKey="_id"
                        filter
                        placeholder="Select an applicant profile"
                        disabled={isEdit} // Prevent changing the owner of credentials
                        onChange={(e) => setLocalUser({ ...localUser, applicant: e.value })}
                        className={classNames({ 'p-invalid': submitted && !localUser.applicant })}
                    />
                </div>

                <div className="field">
                    <label className="font-bold small mb-2 block">System Email</label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon"><i className="pi pi-envelope"></i></span>
                        <InputText
                            value={localUser.email || ''}
                            onChange={(e) => setLocalUser({ ...localUser, email: e.target.value })}
                            placeholder="email@company.com"
                            className={classNames({ 'p-invalid': submitted && !localUser.email })}
                        />
                    </div>
                </div>

                <div className="grid">
                    <div className="col-12 field mt-2">
                        <label className="font-bold small mb-2 block">
                            {isEdit ? 'Change Password (leave blank to keep current)' : 'Account Password'}
                        </label>
                        <Password
                            value={localUser.password || ''}
                            onChange={(e) => setLocalUser({ ...localUser, password: e.target.value })}
                            toggleMask
                            placeholder="••••••••"
                            className={classNames({ 'p-invalid': submitted && !isEdit && !localUser.password })}
                        />
                    </div>

                    <div className="col-12 field">
                        <label className="font-bold small mb-2 block">Confirm Password</label>
                        <Password
                            value={localUser.confirmedPassword || ''}
                            onChange={(e) => setLocalUser({ ...localUser, confirmedPassword: e.target.value })}
                            toggleMask
                            feedback={false}
                            placeholder="Re-type password"
                            className={classNames({ 'p-invalid': submitted && localUser.password !== localUser.confirmedPassword })}
                        />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveAccount;