'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Specialization, validate } from '../models/specialization.model';
import { AcademicLevel } from '../../organizations/models/organization.model';

const createInitialSpecialization = (
    item: Partial<Specialization> | null | undefined
): Specialization => ({
    _id: item?._id,
    name: item?.name ?? '',
    academicLevel: item?.academicLevel ?? ('' as AcademicLevel),
    ...item,
});

const SpecializationForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Specialization>) => {
    const [localSpecialization, setLocalSpecialization] = useState<Specialization>(
        () => createInitialSpecialization(item)
    );
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalSpecialization(createInitialSpecialization(item));
        setSubmitted(false);
    }, [item]);

    const updateField = <K extends keyof Specialization>(
        field: K,
        value: Specialization[K]
    ) => {
        setLocalSpecialization((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const validation = validate(localSpecialization);
        if (!validation.valid) return;

        await onSubmit(localSpecialization);
    };

    const nameInvalid = submitted && !localSpecialization.name;
    const academicLevelInvalid = submitted && !localSpecialization.academicLevel;

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid flex flex-column gap-4"
            noValidate
        >
            {/* Section Header / Description */}
            <div className="surface-border border-bottom-1 pb-2">
                <span className="text-color-secondary text-sm">
                    Configure the academic specialization details and assign its corresponding academic level.
                </span>
            </div>

            <div className="formgrid grid gap-3 md:gap-0">
                {/* Name Field */}
                <div className="field col-12 mb-3">
                    <label htmlFor="name" className="font-medium flex align-items-center gap-2 mb-2">
                        <i className="pi pi-bookmark text-primary"></i>
                        <span>Specialization Name</span>
                    </label>
                    <InputText
                        id="name"
                        value={localSpecialization.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="e.g. Software Engineering"
                        disabled={saving}
                        className={classNames({ 'p-invalid': nameInvalid })}
                    />
                    {nameInvalid && (
                        <small className="p-error mt-1 block">
                            <i className="pi pi-exclamation-circle mr-1"></i>Name is required.
                        </small>
                    )}
                </div>

                {/* Academic Level Field */}
                <div className="field col-12">
                    <label htmlFor="academicLevel" className="font-medium flex align-items-center gap-2 mb-2">
                        <i className="pi pi-graduation-cap text-primary"></i>
                        <span>Academic Level</span>
                    </label>
                    <Dropdown
                        id="academicLevel"
                        value={localSpecialization.academicLevel}
                        options={Object.values(AcademicLevel).map((level) => ({
                            label: level,
                            value: level,
                        }))}
                        onChange={(e) => updateField('academicLevel', e.value)}
                        placeholder="Select Academic Level"
                        disabled={saving}
                        className={classNames({ 'p-invalid': academicLevelInvalid })}
                    />
                    {academicLevelInvalid && (
                        <small className="p-error mt-1 block">
                            <i className="pi pi-exclamation-circle mr-1"></i>Academic level is required.
                        </small>
                    )}
                </div>
            </div>
        </form>
    );
};

export default SpecializationForm;