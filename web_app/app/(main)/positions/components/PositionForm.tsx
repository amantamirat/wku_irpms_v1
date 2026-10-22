'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Position, validatePosition } from '../models/position.model';

const createInitialPosition = (
    item: Partial<Position> | null | undefined
): Position => ({
    _id: item?._id,
    name: item?.name ?? '',
    ...item,
});

const PositionForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Position>) => {
    const [localPosition, setLocalPosition] = useState<Position>(
        () => createInitialPosition(item)
    );
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalPosition(createInitialPosition(item));
        setSubmitted(false);
    }, [item]);

    const updateField = <K extends keyof Position>(
        field: K,
        value: Position[K]
    ) => {
        setLocalPosition((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const validation = validatePosition(localPosition);
        if (!validation.valid) return;

        await onSubmit(localPosition);
    };

    const nameInvalid = submitted && !localPosition.name;

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
                    Configure the organizational position details.
                </span>
            </div>

            <div className="formgrid grid gap-3 md:gap-0">
                {/* Name Field */}
                <div className="field col-12">
                    <label htmlFor="name" className="font-medium flex align-items-center gap-2 mb-2">
                        <i className="pi pi-id-card text-primary"></i>
                        <span>Position Name</span>
                    </label>
                    <InputText
                        id="name"
                        value={localPosition.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="e.g. Senior Developer"
                        autoFocus
                        disabled={saving}
                        className={classNames({ 'p-invalid': nameInvalid })}
                    />
                    {nameInvalid && (
                        <small className="p-error mt-1 block">
                            <i className="pi pi-exclamation-circle mr-1"></i>Name is required.
                        </small>
                    )}
                </div>
            </div>
        </form>
    );
};

export default PositionForm;