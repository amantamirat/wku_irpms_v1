'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Divider } from 'primereact/divider';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { extractId } from '@/utils/utils';

import {
    EmploymentType,
    Experience,
    validateExperience
} from '../models/experience.model';

import {
    Organization,
    OrgnUnit
} from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';

import { Position } from '../../../positions/models/position.model';
import { PositionApi } from '../../../positions/api/position.api';

import { User } from '../../models/user.model';
import { UserApi } from '../../api/user.api';

const ExperienceForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Experience>) => {
    const [localExperience, setLocalExperience] =
        useState<Experience>(() => ({ ...item }));

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const employmentTypes = Object.values(EmploymentType);
    const isUserPredefined = !!item?.user;

    /**
     * Sync form state when the selected item changes.
     */
    useEffect(() => {
        setLocalExperience({ ...item });
        setSubmitted(false);
    }, [item]);

    /**
     * Load organization, position, and user options.
     */
    useEffect(() => {
        let cancelled = false;

        const loadOptions = async () => {
            try {
                const requests = await Promise.all([
                    OrganizationApi.lookup!({
                        type: OrgnUnit.department
                    }),

                    OrganizationApi.lookup!({
                        type: OrgnUnit.external
                    }),

                    PositionApi.lookup!(),

                    isUserPredefined
                        ? Promise.resolve([])
                        : UserApi.lookup!({})
                ]);

                if (cancelled) return;

                setOrganizations([
                    ...requests[0],
                    ...requests[1]
                ]);

                setPositions(requests[2]);

                if (!isUserPredefined) {
                    setUsers(requests[3]);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        'Error loading experience form options:',
                        error
                    );
                }
            }
        };

        void loadOptions();

        return () => {
            cancelled = true;
        };
    }, [isUserPredefined]);

    /**
     * Update a single field.
     */
    const updateField = <K extends keyof Experience>(
        key: K,
        value: Experience[K]
    ) => {
        setLocalExperience((previous) => ({
            ...previous,
            [key]: value
        }));
    };

    /**
     * Normalize references and submit the form.
     */
    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const normalizedExperience: Experience = {
            ...localExperience,
            user: extractId(
                localExperience.user
            ) as Experience['user'],

            organization: extractId(
                localExperience.organization
            ) as Experience['organization'],

            position: extractId(
                localExperience.position
            ) as Experience['position'],

            endDate: localExperience.isCurrent
                ? null
                : localExperience.endDate
        };

        const result = validateExperience(normalizedExperience);

        if (!result.valid) return;

        await onSubmit(normalizedExperience);
    };

    const validation = submitted
        ? validateExperience(localExperience)
        : undefined;

    const fieldInvalid = (field: keyof Experience) => {
        if (!submitted) return false;

        switch (field) {
            case 'user':
                return !extractId(localExperience.user);

            case 'organization':
                return !extractId(localExperience.organization);

            case 'position':
                return !extractId(localExperience.position);

            default:
                return false;
        }
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="formgrid grid p-fluid"
            noValidate
        >
            {/* Member / Staff */}
            <div className="field col-12">
                <label
                    htmlFor="experience-user"
                    className="font-medium text-900 block mb-2"
                >
                    Member / Staff
                    <span className="text-red-500"> *</span>
                </label>

                {isUserPredefined ? (
                    <InputText
                        id="experience-user"
                        value={
                            typeof localExperience.user === 'object'
                                ? (localExperience.user as User).name ?? ''
                                : 'Linked Member'
                        }
                        disabled
                        className="w-full"
                    />
                ) : (
                    <Dropdown
                        id="experience-user"
                        value={extractId(localExperience.user)}
                        options={users}
                        optionLabel="name"
                        optionValue="_id"
                        onChange={(e) =>
                            updateField(
                                'user',
                                e.value as Experience['user']
                            )
                        }
                        placeholder="Select Member"
                        filter
                        showClear
                        className={classNames('w-full', {
                            'p-invalid': fieldInvalid('user')
                        })}
                    />
                )}

                {fieldInvalid('user') && (
                    <small className="p-error block mt-1">
                        Member assignment is required.
                    </small>
                )}
            </div>

            {/* Employment Details */}
            <div className="col-12 py-2">
                <Divider align="left">
                    <span className="text-500 font-normal text-sm">
                        Employment Details
                    </span>
                </Divider>
            </div>

            {/* Organization */}
            <div className="field col-12">
                <label
                    htmlFor="experience-organization"
                    className="font-medium text-900 block mb-2"
                >
                    Organization
                    <span className="text-red-500"> *</span>
                </label>

                <Dropdown
                    id="experience-organization"
                    value={extractId(localExperience.organization)}
                    options={organizations}
                    optionLabel="name"
                    optionValue="_id"
                    onChange={(e) =>
                        updateField(
                            'organization',
                            e.value as Experience['organization']
                        )
                    }
                    placeholder="Select Organization"
                    filter
                    showClear
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('organization')
                    })}
                />

                {fieldInvalid('organization') && (
                    <small className="p-error block mt-1">
                        Organization is required.
                    </small>
                )}
            </div>

            {/* Position */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="experience-position"
                    className="font-medium text-900 block mb-2"
                >
                    Position
                    <span className="text-red-500"> *</span>
                </label>

                <Dropdown
                    id="experience-position"
                    value={extractId(localExperience.position)}
                    options={positions}
                    optionLabel="name"
                    optionValue="_id"
                    onChange={(e) =>
                        updateField(
                            'position',
                            e.value as Experience['position']
                        )
                    }
                    placeholder="Select Position"
                    filter
                    showClear
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('position')
                    })}
                />

                {fieldInvalid('position') && (
                    <small className="p-error block mt-1">
                        Position is required.
                    </small>
                )}
            </div>

            {/* Employment Type */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="experience-employment-type"
                    className="font-medium text-900 block mb-2"
                >
                    Employment Type
                </label>

                <Dropdown
                    id="experience-employment-type"
                    value={localExperience.employmentType}
                    options={employmentTypes.map((type) => ({
                        label: type,
                        value: type
                    }))}
                    onChange={(e) =>
                        updateField(
                            'employmentType',
                            e.value as Experience['employmentType']
                        )
                    }
                    placeholder="Select Employment Type"
                    showClear
                    className="w-full"
                />
            </div>

            {/* Start Date */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="experience-start-date"
                    className="font-medium text-900 block mb-2"
                >
                    Start Date
                </label>

                <Calendar
                    id="experience-start-date"
                    value={
                        localExperience.startDate
                            ? new Date(localExperience.startDate)
                            : null
                    }
                    onChange={(e) =>
                        updateField(
                            'startDate',
                            e.value as Experience['startDate']
                        )
                    }
                    showIcon
                    view="month"
                    dateFormat="mm/yy"
                    placeholder="Select Start Date"
                    className="w-full"
                />
            </div>

            {/* End Date */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="experience-end-date"
                    className="font-medium text-900 block mb-2"
                >
                    End Date
                </label>

                <Calendar
                    id="experience-end-date"
                    value={
                        localExperience.endDate
                            ? new Date(localExperience.endDate)
                            : null
                    }
                    onChange={(e) =>
                        updateField(
                            'endDate',
                            e.value as Experience['endDate']
                        )
                    }
                    showIcon
                    view="month"
                    dateFormat="mm/yy"
                    placeholder="Select End Date"
                    disabled={!!localExperience.isCurrent}
                    className="w-full"
                />
            </div>

            {/* Currently Employed */}
            <div className="field col-12 mt-2">
                <div className="flex align-items-center bg-gray-50 p-3 border-round border-1 border-200">
                    <Checkbox
                        inputId="experience-is-current"
                        checked={!!localExperience.isCurrent}
                        onChange={(e) =>
                            setLocalExperience((previous) => ({
                                ...previous,
                                isCurrent: e.checked ?? false,
                                endDate: e.checked
                                    ? null
                                    : previous.endDate
                            }))
                        }
                    />

                    <label
                        htmlFor="experience-is-current"
                        className="ml-2 font-medium cursor-pointer"
                    >
                        Presently employed in this role
                    </label>
                </div>
            </div>

            {/* Validation Message */}
            {validation && !validation.valid && (
                <div className="col-12">
                    <small className="p-error block">
                        {validation.message}
                    </small>
                </div>
            )}
        </form>
    );
};

export default ExperienceForm;