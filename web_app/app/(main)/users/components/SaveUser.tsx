'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { SpecializationApi } from '@/app/(main)/specializations/api/specialization.api';
import { Specialization } from '@/app/(main)/specializations/models/specialization.model';
import { UserApi } from '../api/user.api';
import { accessibilityOptions, User, genderOptions, validateUser } from '../models/user.model';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';

interface EntitySaveDialogProps<T> {
    visible: boolean;
    item: T;
    onHide: () => void;
    onComplete?: (savedItem: T) => void;
}

const SaveUser = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<User>) => {
    const { hasPermission } = useAuth();
    const toast = useRef<Toast>(null);

    // State
    const [localUser, setLocalUser] = useState<User>({ ...item });
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [workspaces, setWorkspaces] = useState<Organization[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const canReadSpecializations = hasPermission([PERMISSIONS.SPECIALIZATION.READ]);
    const isEdit = !!localUser._id;

    // Reset form when item changes or dialog closes
    useEffect(() => {
        setLocalUser({ ...item });
        if (!visible) setSubmitted(false);
    }, [item, visible]);

    // Data Fetching
    useEffect(() => {
        if (!visible) return;

        const loadFormData = async () => {
            try {
                const [departments, externals] = await Promise.all([
                    OrganizationApi.getAll({ type: OrgnUnit.department }),
                    OrganizationApi.getAll({ type: OrgnUnit.external })
                ]);
                setWorkspaces([...departments, ...externals]);

                if (canReadSpecializations) {
                    const specs = await SpecializationApi.getAll();
                    setSpecializations(specs);
                }
            } catch (err) {
                console.error('Error loading dialog data:', err);
            }
        };

        loadFormData();
    }, [visible, canReadSpecializations]);

    const handleSave = async () => {
        setSubmitted(true);
        const validation = validateUser(localUser);

        if (!validation.valid) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation Error',
                detail: validation.message,
                life: 3000
            });
            return;
        }

        try {
            setLoading(true);
            let saved: User;

            if (isEdit) {
                saved = await UserApi.update(localUser);
            } else {
                saved = await UserApi.create(localUser);
            }

            // Ensure workspace remains populated for the UI return
            const result = { ...saved, workspace: localUser.workspace };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: `User ${isEdit ? 'updated' : 'created'} successfully`,
                life: 2000
            });

            if (onComplete) {
                setTimeout(() => onComplete(result), 1500);
            }
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save record',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} disabled={loading} />
            <Button label="Save" icon="pi pi-check" onClick={handleSave} loading={loading} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={isEdit ? 'Edit User' : 'New User'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {/* Workspace Selection */}
                <div className="field">
                    <label htmlFor="workspace" className="font-bold">Workspace</label>
                    <Dropdown
                        id="workspace"
                        value={localUser.workspace}
                        options={workspaces}
                        optionLabel="name"
                        dataKey="_id"
                        placeholder="Select Workspace"
                        onChange={(e) => setLocalUser({ ...localUser, workspace: e.value })}
                        className={classNames({ 'p-invalid': submitted && !localUser.workspace })}
                    />
                    {submitted && !localUser.workspace && <small className="p-error">Workspace is required.</small>}
                </div>

                {/* Full Name */}
                <div className="field">
                    <label htmlFor="name" className="font-bold">Full Name</label>
                    <InputText
                        id="name"
                        value={localUser.name || ''}
                        onChange={(e) => setLocalUser({ ...localUser, name: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localUser.name })}
                    />
                    {submitted && !localUser.name && <small className="p-error">Full name is required.</small>}
                </div>

                <div className="formgrid grid">
                    {/* Birth Date */}
                    <div className="field col">
                        <label htmlFor="birthDate" className="font-bold">Birth Date</label>
                        <Calendar
                            id="birthDate"
                            value={localUser.birthDate ? new Date(localUser.birthDate) : null}
                            onChange={(e) => setLocalUser({ ...localUser, birthDate: e.value as Date })}
                            dateFormat="yy-mm-dd"
                            showIcon
                            className={classNames({ 'p-invalid': submitted && !localUser.birthDate })}
                        />
                    </div>

                    {/* Gender */}
                    <div className="field col">
                        <label htmlFor="gender" className="font-bold">Gender</label>
                        <Dropdown
                            id="gender"
                            value={localUser.gender}
                            options={genderOptions}
                            placeholder="Select Gender"
                            onChange={(e) => setLocalUser({ ...localUser, gender: e.value })}
                            className={classNames({ 'p-invalid': submitted && !localUser.gender })}
                        />
                    </div>
                </div>

                {/* Identifiers (FIN & ORCID) */}
                <div className="field">
                    <label htmlFor="fin" className="font-bold">FIN (12-digit)</label>
                    <InputText
                        id="fin"
                        value={localUser.fin || ''}
                        maxLength={12}
                        onChange={(e) => setLocalUser({ ...localUser, fin: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && localUser.fin && !/^\d{12}$/.test(localUser.fin) })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="orcid" className="font-bold">ORCID (xxxx-xxxx-xxxx-xxxx)</label>
                    <InputText
                        id="orcid"
                        value={localUser.orcid || ''}
                        placeholder="0000-0000-0000-0000"
                        onChange={(e) => setLocalUser({ ...localUser, orcid: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && localUser.orcid && !/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(localUser.orcid) })}
                    />
                </div>

                {/* Multi-Selects */}
                <div className="field">
                    <label htmlFor="accessibility" className="font-bold">Accessibility Requirements</label>
                    <MultiSelect
                        id="accessibility"
                        value={localUser.accessibility || []}
                        options={accessibilityOptions}
                        placeholder="Select Types"
                        display="chip"
                        onChange={(e) => setLocalUser({ ...localUser, accessibility: e.value })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="specializations" className="font-bold">Specializations</label>
                    <MultiSelect
                        id="specializations"
                        value={localUser.specializations || []}
                        options={specializations}
                        optionLabel="name"
                        dataKey="_id"
                        placeholder="Select Specializations"
                        display="chip"
                        onChange={(e) => setLocalUser({ ...localUser, specializations: e.value })}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveUser;