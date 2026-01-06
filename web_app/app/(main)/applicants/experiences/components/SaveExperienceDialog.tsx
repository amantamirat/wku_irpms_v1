'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

import { Experience, EmploymentType } from '../models/experience.model';
import { Applicant } from '../../models/applicant.model';
import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';

import { ApplicantApi } from '../../api/applicant.api';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { ExperienceApi } from '../api/experience.api';

interface SaveExperienceDialogProps {
    visible: boolean;
    experience: Experience;
    applicantProvided: boolean;
    onHide: () => void;
    onComplete?: (saved: Experience) => void;
}

const SaveExperienceDialog = ({
    visible,
    experience,
    applicantProvided,
    onHide,
    onComplete
}: SaveExperienceDialogProps) => {

    const [localExperience, setLocalExperience] = useState<Experience>({ ...experience });
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const toast = useRef<Toast>(null);

    const employmentTypes = Object.values(EmploymentType);

    /* -------------------- Fetch Data -------------------- */

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const data = await OrganizationApi.getOrganizations({ type: OrgnUnit.Department });
                setOrganizations(data);
            } catch (err) {
                console.error('Failed to fetch organizations', err);
            }
        };
        fetchOrganizations();
    }, []);

    useEffect(() => {
        if (applicantProvided) return;

        const fetchApplicants = async () => {
            try {
                const data = await ApplicantApi.getApplicants({});
                setApplicants(data);
            } catch (err) {
                console.error('Failed to fetch applicants', err);
            }
        };
        fetchApplicants();
    }, [applicantProvided]);

    /* -------------------- Sync Props -------------------- */

    useEffect(() => {
        setLocalExperience({ ...experience });
    }, [experience]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalExperience({ ...experience });
    };

    /* -------------------- Save -------------------- */

    const saveExperience = async () => {
        try {
            setSubmitted(true);

            if (!localExperience.jobTitle) {
                throw new Error('Job title is required');
            }
            if (!localExperience.organization) {
                throw new Error('Organization is required');
            }
            if (!localExperience.startDate) {
                throw new Error('Start date is required');
            }

            let saved: Experience;

            if (localExperience._id) {
                saved = await ExperienceApi.update(localExperience);
            } else {
                saved = await ExperienceApi.create(localExperience);
            }

            saved = { ...localExperience, _id: saved._id };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Experience saved successfully',
                life: 2000,
            });

            if (onComplete) {
                setTimeout(() => onComplete(saved), 2000);
            }

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save experience',
                detail: err.message || 'An error occurred',
                life: 2500,
            });
        }
    };

    /* -------------------- UI -------------------- */

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveExperience} />
        </>
    );

    const isEdit = !!localExperience._id;

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={isEdit ? 'Edit Experience' : 'New Experience'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
                maximized
            >
                {/* Job Title */}
                <div className="field">
                    <label htmlFor="jobTitle">Job Title</label>
                    <InputText
                        id="jobTitle"
                        value={localExperience.jobTitle || ''}
                        onChange={(e) =>
                            setLocalExperience({ ...localExperience, jobTitle: e.target.value })
                        }
                        className={classNames({ 'p-invalid': submitted && !localExperience.jobTitle })}
                    />
                    {submitted && !localExperience.jobTitle &&
                        <small className="p-invalid">Job title is required.</small>}
                </div>

                {/* Organization */}
                <div className="field">
                    <label htmlFor="organization">Organization</label>
                    <Dropdown
                        id="organization"
                        value={localExperience.organization}
                        options={organizations}
                        optionLabel="name"
                        dataKey="_id"
                        onChange={(e) =>
                            setLocalExperience({ ...localExperience, organization: e.value })
                        }
                        placeholder="Select Organization"
                        className={classNames({ 'p-invalid': submitted && !localExperience.organization })}
                    />
                    {submitted && !localExperience.organization &&
                        <small className="p-invalid">Organization is required.</small>}
                </div>

                {/* Applicant */}
                {!applicantProvided && (
                    <div className="field">
                        <label htmlFor="applicant">Applicant</label>
                        <Dropdown
                            id="applicant"
                            value={localExperience.applicant}
                            options={applicants}
                            optionLabel="name"
                            dataKey="_id"
                            onChange={(e) =>
                                setLocalExperience({ ...localExperience, applicant: e.value })
                            }
                            placeholder="Select Applicant"
                            className={classNames({ 'p-invalid': submitted && !localExperience.applicant })}
                        />
                        {submitted && !localExperience.applicant &&
                            <small className="p-invalid">Applicant is required.</small>}
                    </div>
                )}

                {/* Employment Type */}
                <div className="field">
                    <label htmlFor="employmentType">Employment Type</label>
                    <Dropdown
                        id="employmentType"
                        value={localExperience.employmentType}
                        options={employmentTypes}
                        onChange={(e) =>
                            setLocalExperience({ ...localExperience, employmentType: e.value })
                        }
                        placeholder="Select Employment Type"
                    />
                </div>

                {/* Dates */}
                <div className="formgrid grid">
                    <div className="field col-6">
                        <label htmlFor="startDate">Start Date</label>
                        <Calendar
                            id="startDate"
                            value={localExperience.startDate ? new Date(localExperience.startDate) : null}
                            onChange={(e) =>
                                setLocalExperience({ ...localExperience, startDate: e.value as Date })
                            }
                            showIcon
                        />
                    </div>

                    <div className="field col-6">
                        <label htmlFor="endDate">End Date</label>
                        <Calendar
                            id="endDate"
                            value={localExperience.endDate ? new Date(localExperience.endDate) : null}
                            onChange={(e) =>
                                setLocalExperience({ ...localExperience, endDate: e.value as Date })
                            }
                            showIcon
                            disabled={localExperience.isCurrent}
                        />
                    </div>
                </div>

                {/* Current */}
                <div className="field-checkbox">
                    <Checkbox
                        inputId="isCurrent"
                        checked={!!localExperience.isCurrent}
                        onChange={(e) =>
                            setLocalExperience({
                                ...localExperience,
                                isCurrent: e.checked,
                                endDate: e.checked ? null : localExperience.endDate,
                            })
                        }
                    />
                    <label htmlFor="isCurrent">Currently working here</label>
                </div>

            </Dialog>
        </>
    );
};

export default SaveExperienceDialog;
