
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';

import {
    Organization,
    OrgnUnit
} from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';

import { SpecializationApi } from '@/app/(main)/specializations/api/specialization.api';
import { Specialization } from '@/app/(main)/specializations/models/specialization.model';

import {
    accessibilityOptions,
    User,
    genderOptions,
    validateUser
} from '../models/user.model';

interface UserFormProps extends ItemFormRenderProps<User> { }

const UserForm = ({
    item,
    saving,
    formId,
    onSubmit
}: UserFormProps) => {
    const { hasPermission } = useAuth();

    const [localUser, setLocalUser] = useState<User>(() => ({ ...item }));
    const [specializations, setSpecializations] = useState<Specialization[]>([]);
    const [workspaces, setWorkspaces] = useState<Organization[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const canlookSpecializations = hasPermission([
        PERMISSIONS.SPECIALIZATION.LOOKUP
    ]);


    useEffect(() => {
        setLocalUser({ ...item });
        setSubmitted(false);
    }, [item]);

    useEffect(() => {
        let cancelled = false;

        const loadFormData = async () => {
            try {
                const [departments, externals, specs] = await Promise.all([
                    OrganizationApi.lookup!({
                        type: OrgnUnit.department
                    }),
                    OrganizationApi.lookup!({
                        type: OrgnUnit.external
                    }),
                    canlookSpecializations
                        ? SpecializationApi.lookup!()
                        : Promise.resolve([])
                ]);

                if (cancelled) return;

                setWorkspaces([...departments, ...externals]);
                setSpecializations(specs);
            } catch (error) {
                if (!cancelled) {
                    console.error('Error loading user form data:', error);
                }
            }
        };

        void loadFormData();

        return () => {
            cancelled = true;
        };
    }, [canlookSpecializations]);

    const updateField = <K extends keyof User>(
        field: K,
        value: User[K]
    ) => {
        setLocalUser(previous => ({
            ...previous,
            [field]: value
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const validation = validateUser(localUser);

        if (!validation.valid) return;

        await onSubmit(localUser);
    };

    const validation = submitted
        ? validateUser(localUser)
        : undefined;

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="formgrid grid p-fluid"
            noValidate
        >
            {/* Workspace */}
            <div className="field col-12">
                <label
                    htmlFor="user-workspace"
                    className="font-medium text-900 block mb-2"
                >
                    Workspace <span className="text-red-500">*</span>
                </label>

                <Dropdown
                    id="user-workspace"
                    value={
                        typeof localUser.workspace === 'object'
                            ? localUser.workspace?._id
                            : localUser.workspace
                    }
                    options={workspaces}
                    optionLabel="name"
                    optionValue="_id"
                    placeholder="Select Workspace"
                    filter
                    showClear
                    onChange={e =>
                        updateField(
                            'workspace',
                            e.value as User['workspace']
                        )
                    }
                    className={classNames('w-full', {
                        'p-invalid': submitted && !localUser.workspace
                    })}
                />

                {submitted && !localUser.workspace && (
                    <small className="p-error block mt-1">
                        Workspace is required.
                    </small>
                )}
            </div>

            {/* Full Name */}
            <div className="field col-12">
                <label
                    htmlFor="user-name"
                    className="font-medium text-900 block mb-2"
                >
                    Full Name <span className="text-red-500">*</span>
                </label>

                <InputText
                    id="user-name"
                    value={localUser.name || ''}
                    onChange={e => updateField('name', e.target.value)}
                    className={classNames('w-full', {
                        'p-invalid': submitted && !localUser.name?.trim()
                    })}
                />

                {submitted && !localUser.name?.trim() && (
                    <small className="p-error block mt-1">
                        Full name is required.
                    </small>
                )}
            </div>

            {/* Birth Date and Gender */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="user-birth-date"
                    className="font-medium text-900 block mb-2"
                >
                    Birth Date
                </label>

                <Calendar
                    id="user-birth-date"
                    value={
                        localUser.birthDate
                            ? new Date(localUser.birthDate)
                            : null
                    }
                    onChange={e =>
                        updateField(
                            'birthDate',
                            e.value as User['birthDate']
                        )
                    }
                    dateFormat="yy-mm-dd"
                    showIcon
                    className="w-full"
                />
            </div>

            <div className="field col-12 md:col-6">
                <label
                    htmlFor="user-gender"
                    className="font-medium text-900 block mb-2"
                >
                    Gender
                </label>

                <Dropdown
                    id="user-gender"
                    value={localUser.gender}
                    options={genderOptions}
                    placeholder="Select Gender"
                    showClear
                    onChange={e =>
                        updateField('gender', e.value as User['gender'])
                    }
                    className="w-full"
                />
            </div>

            {/* FIN */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="user-fin"
                    className="font-medium text-900 block mb-2"
                >
                    FIN (12-digit)
                </label>

                <InputText
                    id="user-fin"
                    value={localUser.fin || ''}
                    maxLength={12}
                    onChange={e => updateField('fin', e.target.value)}
                    className={classNames('w-full', {
                        'p-invalid':
                            submitted &&
                            !!localUser.fin &&
                            !/^\d{12}$/.test(localUser.fin)
                    })}
                />

                {submitted &&
                    !!localUser.fin &&
                    !/^\d{12}$/.test(localUser.fin) && (
                        <small className="p-error block mt-1">
                            FIN must contain exactly 12 digits.
                        </small>
                    )}
            </div>

            {/* ORCID */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="user-orcid"
                    className="font-medium text-900 block mb-2"
                >
                    ORCID (xxxx-xxxx-xxxx-xxxx)
                </label>

                <InputText
                    id="user-orcid"
                    value={localUser.orcid || ''}
                    placeholder="0000-0000-0000-0000"
                    onChange={e => updateField('orcid', e.target.value)}
                    className={classNames('w-full', {
                        'p-invalid':
                            submitted &&
                            !!localUser.orcid &&
                            !/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(localUser.orcid)
                    })}
                />

                {submitted &&
                    !!localUser.orcid &&
                    !/^\d{4}-\d{4}-\d{4}-\d{4}$/.test(localUser.orcid) && (
                        <small className="p-error block mt-1">
                            Enter a valid ORCID format.
                        </small>
                    )}
            </div>

            {/* Accessibility */}
            <div className="field col-12">
                <label
                    htmlFor="user-accessibility"
                    className="font-medium text-900 block mb-2"
                >
                    Accessibility Requirements
                </label>

                <MultiSelect
                    id="user-accessibility"
                    value={localUser.accessibility || []}
                    options={accessibilityOptions}
                    placeholder="Select Types"
                    display="chip"
                    onChange={e =>
                        updateField(
                            'accessibility',
                            e.value as User['accessibility']
                        )
                    }
                    className="w-full"
                />
            </div>

            {/* Specializations */}
            {canlookSpecializations && (
                <div className="field col-12">
                    <label
                        htmlFor="user-specializations"
                        className="font-medium text-900 block mb-2"
                    >
                        Specializations
                    </label>

                    <MultiSelect
                        id="user-specializations"
                        value={localUser.specializations || []}
                        options={specializations}
                        optionLabel="name"
                        optionValue="_id"
                        placeholder="Select Specializations"
                        display="chip"
                        filter
                        onChange={e =>
                            updateField(
                                'specializations',
                                e.value as User['specializations']
                            )
                        }
                        className="w-full"
                    />
                </div>
            )}

            {/* Model validation */}
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

export default UserForm;
