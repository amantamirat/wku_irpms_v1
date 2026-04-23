'use client';

import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { EmploymentType, Experience, validateExperience } from '../models/experience.model';

import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { PositionApi } from '../../../positions/api/position.api';
import { Position, PositionType } from '../../../positions/models/position.model';
import { ExperienceApi } from '../api/experience.api';

interface SaveExperienceDialogProps {
    visible: boolean;
    experience: Experience;
    onHide: () => void;
    onComplete?: (saved: Experience) => void;
}

const SaveExperienceDialog = ({
    visible,
    experience,
    onHide,
    onComplete
}: SaveExperienceDialogProps) => {

    const [localExperience, setLocalExperience] = useState<Experience>({ ...experience });
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [ranks, setRanks] = useState<Position[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const toast = useRef<Toast>(null);

    const employmentTypes = Object.values(EmploymentType);

    /* -------------------- Fetch Data -------------------- */

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const [departments, externals] = await Promise.all([
                    OrganizationApi.getAll({ type: OrgnUnit.department }),
                    OrganizationApi.getAll({ type: OrgnUnit.external })
                ]);
                setOrganizations([...departments, ...externals]);
            } catch (err) {
                console.error('Failed to fetch organizations', err);
            }
        };
        fetchOrganizations();
    }, []);

    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const positions = await PositionApi.getAll({ type: PositionType.position });
                setPositions(positions);
            } catch (err) {
                console.error('Failed to fetch positions', err);
            }
        };
        fetchPositions();
    }, []);


    useEffect(() => {
        const fetchRanks = async () => {

            // ✅ If no position selected → reset ranks & rank
            if (!localExperience.position) {
                setRanks([]);
                setLocalExperience(prev => ({
                    ...prev,
                    rank: undefined
                }));
                return;
            }

            try {
                const ranks = await PositionApi.getAll({
                    parent: typeof localExperience.position === "string"
                        ? localExperience.position
                        : localExperience.position._id
                });

                setRanks(ranks);
            } catch (err) {
                console.error('Failed to fetch ranks', err);
            }
        };

        fetchRanks();
    }, [localExperience.position]);


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
            const validation = validateExperience(localExperience);
            if (!validation.valid) {
                throw new Error(validation.message);
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

                {/* Position */}
                <div className="field">
                    <label htmlFor="position">Position</label>
                    <Dropdown
                        id="position"
                        value={localExperience.position}
                        options={positions}
                        optionLabel="name"
                        dataKey="_id"
                        onChange={(e) =>
                            setLocalExperience({ ...localExperience, position: e.value })
                        }
                        placeholder="Select Position"
                        className={classNames({ 'p-invalid': submitted && !localExperience.position })}
                    />
                    {submitted && !localExperience.position &&
                        <small className="p-invalid">Position is required.</small>}
                </div>

                {/* Rank */}
                <div className="field">
                    <label htmlFor="rank">Rank</label>
                    <Dropdown
                        id="rank"
                        value={localExperience.rank}
                        options={ranks}
                        optionLabel="name"
                        dataKey="_id"
                        onChange={(e) =>
                            setLocalExperience({ ...localExperience, rank: e.value })
                        }
                        placeholder="Select Rank"
                        className={classNames({ 'p-invalid': submitted && !localExperience.rank })}
                    />
                    {submitted && !localExperience.rank &&
                        <small className="p-invalid">Rank is required.</small>}
                </div>


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
