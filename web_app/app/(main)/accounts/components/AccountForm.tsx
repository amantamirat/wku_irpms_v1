'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { ItemFormRenderProps } from '@/components/ItemManager';
import { Account, validateAccount } from '../models/account.model';
import { UserApi } from '../../users/api/user.api';
import { User } from '../../users/models/user.model';

const AccountForm = ({ mode, item, saving, formId, onSubmit }: ItemFormRenderProps<Account>) => {
    // The form is only mounted while the dialog is open, so state starts fresh each time
    const [initial] = useState<Account>(() => item ?? { email: '', password: '', confirmedPassword: '' });
    
    const [localUser, setLocalUser] = useState<Partial<Account>>({
        ...initial,
        password: '',
        confirmedPassword: '',
    });

    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const isEdit = mode === 'edit';

    /* --------------------------- Load users lookup --------------------------- */

    useEffect(() => {
        let cancelled = false;
        setLoadingUsers(true);

        UserApi.lookup!({})
            .then((data) => {
                if (!cancelled) setUsers(data);
            })
            .catch(() => {
                // Handle error silently or via toast if available
            })
            .finally(() => {
                if (!cancelled) setLoadingUsers(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    /* -------------------------------- Submit -------------------------------- */

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (saving) return;

        const needsPassword = !isEdit || !!localUser.password;
        const validation = validateAccount(localUser as Account, !needsPassword);

        if (!validation.valid) return;

        // Prepare payload: if editing and password was NOT touched/entered, strip it out completely
        const payload: Partial<Account> = { ...localUser };
        if (isEdit && !payload.password) {
            delete payload.password;
            delete payload.confirmedPassword;
        }

        await onSubmit(payload);
    };

    /* -------------------------------- Render -------------------------------- */

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            <div className="field mb-4">
                <label className="font-bold text-sm block mb-2">Link to User</label>
                <Dropdown
                    value={localUser.user}
                    options={users}
                    optionLabel="name"
                    dataKey="_id"
                    filter
                    filterMatchMode="contains"
                    filterLocale="en"
                    filterBy="name"
                    placeholder={loadingUsers ? 'Loading users...' : 'Select user profile'}
                    disabled={isEdit || saving} // Prevent changing the owner of credentials during edit
                    onChange={(e) => setLocalUser({ ...localUser, user: e.value })}
                    className={classNames({ 'p-invalid': submitted && !localUser.user })}
                />
                {submitted && !localUser.user && (
                    <small className="p-error">A user profile is required.</small>
                )}
            </div>

            <div className="field mb-4">
                <label className="font-bold text-sm block mb-2">Account Email</label>
                <div className="p-inputgroup">
                    <span className="p-inputgroup-addon">
                        <i className="pi pi-envelope"></i>
                    </span>
                    <InputText
                        value={localUser.email || ''}
                        onChange={(e) => setLocalUser({ ...localUser, email: e.target.value })}
                        placeholder="email@company.com"
                        disabled={saving}
                        className={classNames({ 'p-invalid': submitted && !localUser.email })}
                    />
                </div>
                {submitted && !localUser.email && (
                    <small className="p-error">An email address is required.</small>
                )}
            </div>

            <div className="field mb-4">
                <label className="font-bold text-sm block mb-2">
                    {isEdit ? 'Change Password (leave blank to keep current)' : 'Account Password'}
                </label>
                <Password
                    value={localUser.password || ''}
                    onChange={(e) => setLocalUser({ ...localUser, password: e.target.value })}
                    toggleMask
                    placeholder="••••••••"
                    disabled={saving}
                    className={classNames({ 'p-invalid': submitted && !isEdit && !localUser.password })}
                />
                {submitted && !isEdit && !localUser.password && (
                    <small className="p-error">Password is required.</small>
                )}
            </div>

            <div className="field mb-4">
                <label className="font-bold text-sm block mb-2">Confirm Password</label>
                <Password
                    value={localUser.confirmedPassword || ''}
                    onChange={(e) => setLocalUser({ ...localUser, confirmedPassword: e.target.value })}
                    toggleMask
                    feedback={false}
                    placeholder="Re-type password"
                    disabled={saving}
                    className={classNames({
                        'p-invalid': submitted && localUser.password !== localUser.confirmedPassword,
                    })}
                />
                {submitted && localUser.password !== localUser.confirmedPassword && (
                    <small className="p-error">Passwords do not match.</small>
                )}
            </div>
        </form>
    );
};

export default AccountForm;