'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { UserApi } from '../api/user.api';
import { User, validateUser } from '../models/user.model';
import { Applicant } from '../../applicants/models/applicant.model';
import { ApplicantApi } from '../../applicants/api/applicant.api';
import { Dropdown } from 'primereact/dropdown';

// Using the requested generic props interface
interface EntitySaveDialogProps<T> {
    visible: boolean;
    item: T;
    onHide: () => void;
    onComplete?: (savedItem: T) => void;
}

const SaveUser = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<User>) => {
    const toast = useRef<Toast>(null);
    const [localUser, setLocalUser] = useState<User>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [applicants, setApplicants] = useState<Applicant[]>([]);

    useEffect(() => {
        setLocalUser({ ...item });
    }, [item]);

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                const appData = await ApplicantApi.getAll({});
                setApplicants(appData);
            } catch (err) {
                console.error('Failed to fetch applicant data:', err);
            }
        };
        if (visible) fetchApplicants();
    }, [visible]);

    const saveUser = async () => {
        setSubmitted(true);
        setErrorMessage(undefined);

        try {
            // Validate without the currentPassword requirement
            const validation = validateUser(localUser, false);
            if (!validation.valid) {
                setErrorMessage(validation.message);
                return;
            }

            let saved: User;
            if (localUser._id) {
                // Update existing user
                saved = await UserApi.update(localUser);
                // Ensure the applicant object remains attached if the API returns only the ID
                saved = { ...saved, applicant: localUser.applicant };
            } else {
                // Create new user
                saved = await UserApi.create(localUser);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'User saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save user',
                detail: err.message || 'An unexpected error occurred',
                life: 3000,
            });
        }
    };

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalUser({ ...item });
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" onClick={saveUser} />
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
                {/* Applicant Selection */}
                <div className="field">
                    <label htmlFor="applicant" className="font-bold">Applicant</label>
                    <Dropdown
                        id="applicant"
                        value={localUser.applicant}
                        options={applicants}
                        optionLabel="name"
                        dataKey="_id"
                        filter
                        filterBy="name,email"
                        showClear
                        onChange={(e) => setLocalUser({ ...localUser, applicant: e.value })}
                        placeholder="Select Applicant"
                        disabled={isEdit}
                        className={classNames({ 'p-invalid': submitted && !localUser.applicant })}
                    />
                    {submitted && !localUser.applicant && <small className="p-error">Applicant is required.</small>}
                </div>

                {/* Email Field */}
                <div className="field">
                    <label htmlFor="email" className="font-bold">Email</label>
                    <InputText
                        id="email"
                        type="email"
                        value={localUser.email || ''}
                        onChange={(e) => setLocalUser({ ...localUser, email: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localUser.email })}
                    />
                    {submitted && !localUser.email && <small className="p-error">Email is required.</small>}
                </div>

                {/* Password Field */}
                <div className="field">
                    <label htmlFor="password">Password</label>
                    <Password
                        id="password"
                        value={localUser.password || ''}
                        onChange={(e) => setLocalUser({ ...localUser, password: e.target.value })}
                        toggleMask
                        className={classNames({ 'p-invalid': submitted && !localUser.password })}
                    />
                    {submitted && !localUser.password && <small className="p-error">Password is required.</small>}
                </div>

                {/* Confirm Password Field */}
                <div className="field">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <Password
                        id="confirmPassword"
                        value={localUser.confirmedPassword || ''}
                        onChange={(e) => setLocalUser({ ...localUser, confirmedPassword: e.target.value })}
                        toggleMask
                        feedback={false}
                        className={classNames({ 'p-invalid': submitted && !localUser.confirmedPassword })}
                    />
                    {submitted && !localUser.confirmedPassword && <small className="p-error">Confirmation is required.</small>}
                </div>

                {errorMessage && <div className="p-error mt-2 font-semibold text-center">{errorMessage}</div>}
            </Dialog>
        </>
    );
};

export default SaveUser;