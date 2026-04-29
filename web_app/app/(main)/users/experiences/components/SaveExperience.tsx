'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';

import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { EmploymentType, Experience, validateExperience } from '../models/experience.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { PositionApi } from '../../../positions/api/position.api';
import { Position } from '../../../positions/models/position.model';
import { ExperienceApi } from '../api/experience.api';
import { UserApi } from '../../api/user.api';
import { User } from '../../models/user.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveExperienceDialog = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<Experience>) => {
    
    const [localExperience, setLocalExperience] = useState<Experience>({ ...item });
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    const toast = useRef<Toast>(null);
    const employmentTypes = Object.values(EmploymentType);

    // Check if user is already linked (e.g., viewing a specific profile)
    const isUserPredefined = !!item.user;

    useEffect(() => {
        const loadData = async () => {
            try {
                const [depts, externs, pos, userList] = await Promise.all([
                    OrganizationApi.getAll({ type: OrgnUnit.department }),
                    OrganizationApi.getAll({ type: OrgnUnit.external }),
                    PositionApi.getAll({}),
                    !isUserPredefined ? UserApi.getAll({}) : Promise.resolve([])
                ]);
                setOrganizations([...depts, ...externs]);
                setPositions(pos);
                if (!isUserPredefined) setUsers(userList);
            } catch (err) {
                console.error('Data load failed', err);
            }
        };
        if (visible) loadData();
    }, [visible, isUserPredefined]);

    useEffect(() => {
        setLocalExperience({ ...item });
    }, [item]);

    const handleSave = async () => {
        setSubmitted(true);
        const validation = validateExperience(localExperience);

        if (!validation.valid) {
            toast.current?.show({ severity: 'warn', summary: 'Validation', detail: validation.message });
            return;
        }

        setSaving(true);
        try {
            const method = localExperience._id ? ExperienceApi.update : ExperienceApi.create;
            const saved = await method(localExperience);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Experience record saved' });
            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message });
        } finally {
            setSaving(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-text p-button-secondary" />
            <Button label="Save Experience" icon="pi pi-check" onClick={handleSave} loading={saving} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '650px' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header={<div className="flex align-items-center gap-2"><i className="pi pi-briefcase text-primary text-xl"></i> <span>{localExperience._id ? 'Edit Experience' : 'Add Experience'}</span></div>}
                modal
                footer={footer}
                onHide={onHide}
                contentClassName="p-4"
            >
                <div className="p-fluid grid">

                    {/* User Selection Section */}
                    <div className="col-12">
                        <label className="font-bold block mb-2">Member / Staff</label>
                        {isUserPredefined ? (
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon"><i className="pi pi-user"></i></span>
                                <InputText
                                    value={(localExperience.user as User)?.name || 'Linked Member'}
                                    disabled
                                    className="bg-gray-50 font-medium"
                                />
                            </div>
                        ) : (
                            <Dropdown
                                value={localExperience.user}
                                options={users}
                                optionLabel="name"
                                dataKey="_id"
                                placeholder="Select Member"
                                filter
                                showClear
                                onChange={(e) => setLocalExperience({ ...localExperience, user: e.value })}
                                className={classNames({ 'p-invalid': submitted && !localExperience.user })}
                            />
                        )}
                        {submitted && !localExperience.user && <small className="p-error">Member assignment is required.</small>}
                    </div>

                    <div className="col-12 py-2">
                        <Divider align="left"><span className="text-500 font-normal text-sm">Employment Details</span></Divider>
                    </div>

                    {/* Organization */}
                    <div className="col-12">
                        <label htmlFor="organization" className="font-bold block mb-2">Organization</label>
                        <Dropdown
                            id="organization"
                            value={localExperience.organization}
                            options={organizations}
                            optionLabel="name"
                            dataKey="_id"
                            filter
                            onChange={(e) => setLocalExperience({ ...localExperience, organization: e.value })}
                            placeholder="Search organization..."
                            className={classNames({ 'p-invalid': submitted && !localExperience.organization })}
                        />
                    </div>

                    {/* Position & Type */}
                    <div className="col-12 md:col-6">
                        <label htmlFor="position" className="font-bold block mb-2">Position</label>
                        <Dropdown
                            id="position"
                            value={localExperience.position}
                            options={positions}
                            optionLabel="name"
                            dataKey="_id"
                            onChange={(e) => setLocalExperience({ ...localExperience, position: e.value })}
                            placeholder="Select Role"
                            className={classNames({ 'p-invalid': submitted && !localExperience.position })}
                        />
                    </div>

                    <div className="col-12 md:col-6">
                        <label htmlFor="employmentType" className="font-bold block mb-2">Type</label>
                        <Dropdown
                            id="employmentType"
                            value={localExperience.employmentType}
                            options={employmentTypes}
                            onChange={(e) => setLocalExperience({ ...localExperience, employmentType: e.value })}
                            placeholder="Employment Type"
                        />
                    </div>

                    {/* Timeline */}
                    <div className="col-12 md:col-6">
                        <label htmlFor="startDate" className="font-bold block mb-2">Start Date</label>
                        <Calendar
                            id="startDate"
                            value={localExperience.startDate ? new Date(localExperience.startDate) : null}
                            onChange={(e) => setLocalExperience({ ...localExperience, startDate: e.value as Date })}
                            showIcon
                            view="month"
                            dateFormat="mm/yy"
                        />
                    </div>

                    <div className="col-12 md:col-6">
                        <label htmlFor="endDate" className="font-bold block mb-2">End Date</label>
                        <Calendar
                            id="endDate"
                            value={localExperience.endDate ? new Date(localExperience.endDate) : null}
                            onChange={(e) => setLocalExperience({ ...localExperience, endDate: e.value as Date })}
                            showIcon
                            disabled={localExperience.isCurrent}
                            view="month"
                            dateFormat="mm/yy"
                        />
                    </div>

                    <div className="col-12 mt-2">
                        <div className="flex align-items-center bg-gray-50 p-3 border-round border-1 border-200">
                            <Checkbox
                                inputId="isCurrent"
                                checked={!!localExperience.isCurrent}
                                onChange={(e) => setLocalExperience({
                                    ...localExperience,
                                    isCurrent: e.checked ?? false,
                                    endDate: e.checked ? null : localExperience.endDate,
                                })}
                            />
                            <label htmlFor="isCurrent" className="ml-2 font-medium cursor-pointer">
                                Presently employed in this role
                            </label>
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveExperienceDialog;