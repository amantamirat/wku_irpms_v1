'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { User, UserStatus, validateUser } from '../models/user.model';
import { Role } from '../../roles/models/role.model';
import { RoleApi } from '../../roles/api/role.api';
import { UserApi } from '../api/UserService';
import { Dropdown } from 'primereact/dropdown';
import { OrganizationApi } from '../../organizations/api/organization.api';
import { Organization } from '../../organizations/models/organization.model';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';
import { ApplicantApi } from '../../applicants/api/applicant.api';
import { Applicant } from '../../applicants/models/applicant.model';


interface SaveUserDialogProps {
    visible: boolean;
    user: User;
    onHide: () => void;
    onComplete?: (savedUser: User) => void;
}

const SaveUserDialog = ({ visible, user, onHide, onComplete }: SaveUserDialogProps) => {
    const toast = useRef<Toast>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [localUser, setLocalUser] = useState<User>({ ...user });
    //const [roles, setRoles] = useState<Role[]>([]);
    //const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const { hasPermission } = useAuth();
    // const readOrganization = hasPermission([PERMISSIONS.ORGANIAZTION.READ]);

    useEffect(() => {
        setLocalUser({ ...user });
    }, [user]);

    useEffect(() => {
        /*
        const fetchApplicants = async () => {
            try {
                const data = await ApplicantApi.getApplicants({});
                setApplicants(data);
            } catch (err) {
                console.error("Failed to fetch applicants:", err);
            }
        };
        fetchApplicants();
*/
        
    }, []);

    const saveUser = async () => {
        try {
            setSubmitted(true);
            const validation = validateUser(localUser);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved: User;
            if (localUser._id) {
                saved = await UserApi.updateUser(localUser);
            } else {
                saved = await UserApi.createUser(localUser);
            }
            saved = {
                ...saved,
                applicant: localUser.applicant,
                roles: localUser.roles,
                organizations: localUser.organizations
            };
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
                header={isEdit ? 'Edit User' : 'New User'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >

                <div className="field">
                    <label htmlFor="applicant">
                        Applicant
                    </label>
                    <Dropdown
                        id="applicant"
                        dataKey="_id"
                        value={localUser.applicant}
                        options={applicants}
                        optionLabel="first_name"
                        onChange={(e) => setLocalUser({ ...localUser, applicant: e.value })}
                        placeholder={"Select applicant"}
                        className={classNames({ 'p-invalid': submitted && !localUser.applicant })}
                    />
                </div>
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

                {!isEdit && (
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



                {
                    /**
                     * 
                     * <div className="field">
                    <label htmlFor="roles">Roles</label>
                    <MultiSelect
                        id="roles"
                        dataKey="_id"
                        value={localUser.roles}
                        options={roles}
                        optionLabel="role_name"
                        onChange={(e) => setLocalUser({ ...localUser, roles: e.value })}
                        placeholder="select roles"
                        display="chip"
                        className={classNames({ 'p-invalid': submitted && !localUser.roles?.length })}
                    />
                </div>
                     */
                }



                {
                    /*
                readOrganization && <div className="field">
                    <label htmlFor="organizations">Organizations</label>
                    <MultiSelect
                        id="organizations"
                        dataKey="_id"
                        value={localUser.organizations}
                        options={organizations}
                        optionLabel="name"
                        onChange={(e) => setLocalUser({ ...localUser, organizations: e.value })}
                        placeholder="select ownerships"
                        display="chip"
                    />
                </div>
                */
                }


                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
}

export default SaveUserDialog;