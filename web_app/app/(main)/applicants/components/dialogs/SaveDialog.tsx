'use client';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { Organization } from '@/app/(main)/organizations/models/organization.model';
import { Button } from 'primereact/button';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { accessibilityOptions, Applicant, genderOptions, Scope, scopeToOrganizationUnit, validateApplicant } from '../../models/applicant.model';
import { ApplicantApi } from '../../api/applicant.api';
import { useAuth } from '@/contexts/auth-context';

interface SaveApplicantDialogProps {
    visible: boolean;
    applicant: Applicant;
    onHide: () => void;
    onComplete?: (savedApplicant: Applicant) => void;
}

const SaveApplicantDialog = ({ visible, applicant, onHide, onComplete }: SaveApplicantDialogProps) => {
    const { getOrganizationsByType } = useAuth();
    const [localApplicant, setLocalApplicant] = useState<Applicant>({ ...applicant });
    const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const toast = useRef<Toast>(null);

    useEffect(() => {
        const fetchOrganizations = () => {
            try {
                if (!localApplicant.scope) return;
                const type = scopeToOrganizationUnit[localApplicant.scope];
                if (type) {
                    const data = getOrganizationsByType(type);
                    setUserOrganizations(data);
                }
            } catch (err) {
                console.error('Failed to fetch organizations:', err);
            }
        };
        fetchOrganizations();
    }, [localApplicant.scope]);

    useEffect(() => {
        setLocalApplicant({ ...applicant });
    }, [applicant]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalApplicant({ ...applicant });
    };

    const saveApplicant = async () => {
        try {
            setSubmitted(true);
            const validation = validateApplicant(localApplicant);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved: Applicant;
            if (localApplicant._id) {
                saved = await ApplicantApi.updateApplicant(localApplicant);
            } else {
                saved = await ApplicantApi.createApplicant(localApplicant);
            }
            saved = {
                ...saved,
                organization: localApplicant.organization
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Applicant saved successfully',
                life: 2000,
            });
            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save applicant',
                detail: err.message || 'An error occurred',
                life: 2000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveApplicant} />
        </>
    );

    const isEdit = !!localApplicant._id;
    const isAcademic = localApplicant.scope === Scope.academic;
    const isSupportive = localApplicant.scope === Scope.supportive;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={isEdit ? 'Edit Applicant' : 'New Applicant'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {!localApplicant._id &&
                    <>
                        <div className="field">
                            <label htmlFor="organization">
                                {isAcademic ? 'Department' : isSupportive ? 'Office' : 'Organization'}
                            </label>
                            <Dropdown
                                id="organization"
                                value={localApplicant.organization}
                                options={userOrganizations}
                                optionLabel="name"
                                onChange={(e) => setLocalApplicant({ ...localApplicant, organization: e.value })}
                                placeholder="Select Department"
                                className={classNames({ 'p-invalid': submitted && !localApplicant.organization })}
                            />
                        </div>
                    </>}

                <div className="field">
                    <label htmlFor="first_name">First Name</label>
                    <InputText
                        id="first_name"
                        value={localApplicant.first_name}
                        onChange={(e) => setLocalApplicant({ ...localApplicant, first_name: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localApplicant.first_name })}
                    />
                    {submitted && !localApplicant.first_name && (
                        <small className="p-invalid">First Name is required.</small>
                    )}
                </div>

                <div className="field">
                    <label htmlFor="last_name">Last Name</label>
                    <InputText
                        id="last_name"
                        value={localApplicant.last_name}
                        onChange={(e) => setLocalApplicant({ ...localApplicant, last_name: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localApplicant.last_name })}
                    />
                    {submitted && !localApplicant.last_name && (
                        <small className="p-invalid">Last Name is required.</small>
                    )}
                </div>

                <div className="field">
                    <label htmlFor="birth_date">Birth Date</label>
                    <PrimeCalendar
                        id="birth_date"
                        value={localApplicant.birth_date ? new Date(localApplicant.birth_date) : undefined}
                        onChange={(e) => setLocalApplicant({ ...localApplicant, birth_date: e.value! })}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className={classNames({ 'p-invalid': submitted && !localApplicant.birth_date })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="gender">Gender</label>
                    <Dropdown
                        id="gender"
                        value={localApplicant.gender}
                        options={genderOptions}
                        onChange={(e) => setLocalApplicant({ ...localApplicant, gender: e.value })}
                        placeholder="Select Gender"
                        className={classNames({ 'p-invalid': submitted && !localApplicant.gender })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="email">Email</label>
                    <InputText
                        id="email"
                        type="email"
                        value={localApplicant.email ?? ''}
                        onChange={(e) => setLocalApplicant({ ...localApplicant, email: e.target.value })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="accessibility">Accessibility</label>
                    <MultiSelect
                        id="accessibility"
                        value={localApplicant.accessibility || []}
                        options={accessibilityOptions}
                        onChange={(e) => setLocalApplicant({ ...localApplicant, accessibility: e.value })}
                        placeholder="Select Accessibility Types"
                        display="chip"
                    />
                </div>

                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
};

export default SaveApplicantDialog;
