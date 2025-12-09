'use client';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { Button } from 'primereact/button';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { accessibilityOptions, Applicant, applicantUnits, genderOptions, validateApplicant } from '../../models/applicant.model';
import { ApplicantApi } from '../../api/applicant.api';
import { useAuth } from '@/contexts/auth-context';
import { Role } from '@/app/(main)/roles/models/role.model';
import { RoleApi } from '@/app/(main)/roles/api/role.api';
import { PERMISSIONS } from '@/types/permissions';
import { Specialization } from '@/app/(main)/specializations/models/specialization.model';
import { SpecializationApi } from '@/app/(main)/specializations/api/specialization.api';

interface SaveApplicantDialogProps {
    visible: boolean;
    applicant: Applicant;
    hasWorkspace: boolean;
    onHide: () => void;
    onComplete?: (savedApplicant: Applicant) => void;
}

const SaveApplicantDialog = ({ visible, applicant, hasWorkspace, onHide, onComplete }: SaveApplicantDialogProps) => {


    const { getOrganizationsByType, hasPermission } = useAuth();
    const canReadRoles = hasPermission([PERMISSIONS.ROLE.READ]);
    const canReadSpecializations = hasPermission([PERMISSIONS.SPECIALIZATION.READ]);

    const [localApplicant, setLocalApplicant] = useState<Applicant>({ ...applicant });
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
    const [ownerships, setOwnerships] = useState<Organization[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (hasWorkspace) return
        const fetchOrganizations = async () => {
            try {
                const depData = await OrganizationApi.getOrganizations({ type: OrgnUnit.Department });
                const extData = await OrganizationApi.getOrganizations({ type: OrgnUnit.External });
                const dirData = await OrganizationApi.getOrganizations({ type: OrgnUnit.Directorate });
                setUserOrganizations([...depData, ...extData]);
                setOwnerships([...dirData, ...depData, ...extData]);
                //}
            } catch (err) {
                console.error('Failed to fetch organizations:', err);
            }
        };
        fetchOrganizations();
    }, [hasWorkspace]);


    useEffect(() => {
        if (!canReadRoles) {
            return;
        }
        const fetchRoles = async () => {
            try {
                const rolesData = await RoleApi.getRoles();
                setRoles(rolesData);
            } catch (err) {
                console.error('Failed to fetch roles:', err);
            }
        };
        fetchRoles();
    }, []);


    useEffect(() => {
        if (!canReadSpecializations) {
            return;
        }
        const fetchSpecs = async () => {
            try {
                const specs = await SpecializationApi.getSpecializations();
                setSpecializations(specs);
            } catch (err) {
                console.error('Failed to fetch specializations:', err);
            }
        };
        fetchSpecs();
    }, []);

    useEffect(() => {
        setLocalApplicant({ ...applicant });
    }, [applicant]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        //setErrorMessage(undefined);
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
                workspace: localApplicant.workspace
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
                maximized
            >


                <>
                    {!hasWorkspace
                        &&
                        <div className="field">
                            <label htmlFor="workspace">
                                Workspace
                            </label>
                            <Dropdown
                                id="workspace"
                                dataKey="_id"
                                value={localApplicant.workspace}
                                options={userOrganizations}
                                optionLabel="name"
                                onChange={(e) => setLocalApplicant({ ...localApplicant, workspace: e.value })}
                                placeholder="Select Workspace"
                                className={classNames({ 'p-invalid': submitted && !localApplicant.workspace })}
                            />
                        </div>
                    }
                    <div className="field">
                        <label htmlFor="name">Full Name</label>
                        <InputText
                            id="name"
                            value={localApplicant.name}
                            onChange={(e) => setLocalApplicant({ ...localApplicant, name: e.target.value })}
                            className={classNames({ 'p-invalid': submitted && !localApplicant.name })}
                        />
                        {submitted && !localApplicant.name && (
                            <small className="p-invalid">Name is required.</small>
                        )}
                    </div>

                    <div className="field">
                        <label htmlFor="birthDate">Birth Date</label>
                        <PrimeCalendar
                            id="birthDate"
                            value={localApplicant.birthDate ? new Date(localApplicant.birthDate) : undefined}
                            onChange={(e) => setLocalApplicant({ ...localApplicant, birthDate: e.value! })}
                            dateFormat="yy-mm-dd"
                            showIcon
                            className={classNames({ 'p-invalid': submitted && !localApplicant.birthDate })}
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
                        <label htmlFor="fin">FIN (12-digit)</label>
                        <InputText
                            id="fin"
                            value={localApplicant.fin || ""}
                            onChange={(e) =>
                                setLocalApplicant({ ...localApplicant, fin: e.target.value })
                            }
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    localApplicant.fin &&
                                    !/^\d{12}$/.test(localApplicant.fin),
                            })}
                            maxLength={12}
                        />
                        {submitted && localApplicant.fin && !/^\d{12}$/.test(localApplicant.fin) && (
                            <small className="p-invalid">FIN must be exactly 12 digits.</small>
                        )}
                    </div>

                    <div className="field">
                        <label htmlFor="orcid">ORCID (xxxx-xxxx-xxxx-xxxx)</label>
                        <InputText
                            id="orcid"
                            value={localApplicant.orcid || ""}
                            onChange={(e) =>
                                setLocalApplicant({ ...localApplicant, orcid: e.target.value })
                            }
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    localApplicant.orcid &&
                                    !/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(localApplicant.orcid),
                            })}
                            placeholder="0000-0000-0000-0000"
                        />
                        {submitted &&
                            localApplicant.orcid &&
                            !/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(localApplicant.orcid) && (
                                <small className="p-invalid">
                                    ORCID must follow the format xxxx-xxxx-xxxx-xxxx.
                                </small>
                            )}
                    </div>

                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <InputText
                            id="email"
                            type="email"
                            value={localApplicant.email}
                            onChange={(e) => setLocalApplicant({ ...localApplicant, email: e.target.value })}
                            className={classNames({ 'p-invalid': submitted && !localApplicant.email })}
                        />
                        {submitted && !localApplicant.email && (
                            <small className="p-invalid">Email is required.</small>
                        )}
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

                    {isEdit &&
                        <div className="field">
                            <label htmlFor="specializations">Specializations</label>
                            <MultiSelect
                                id="specializations"
                                dataKey="_id"
                                value={localApplicant.specializations}
                                options={specializations}
                                optionLabel="name"
                                onChange={(e) => setLocalApplicant({ ...localApplicant, specializations: e.value })}
                                placeholder="select specializations"
                                display="chip"
                            />
                        </div>
                    }

                    {(canReadRoles && isEdit) && <>
                        <div className="field">
                            <label htmlFor="roles">Roles</label>
                            <MultiSelect
                                id="roles"
                                dataKey="_id"
                                value={localApplicant.roles}
                                options={roles}
                                optionLabel="name"
                                onChange={(e) => setLocalApplicant({ ...localApplicant, roles: e.value })}
                                placeholder="select roles"
                                display="chip"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="ownerships">Ownerships</label>
                            <MultiSelect
                                id="ownerships"
                                dataKey="_id"
                                value={localApplicant.ownerships}
                                options={ownerships}
                                optionLabel="name"
                                onChange={(e) => setLocalApplicant({ ...localApplicant, ownerships: e.value })}
                                placeholder="select ownerships"
                                display="chip"
                            />
                        </div>
                    </>
                    }
                </>

                {
                    //{errorMessage && <small className="p-error">{errorMessage}</small>}
                }
            </Dialog>
        </>
    );
};

export default SaveApplicantDialog;
