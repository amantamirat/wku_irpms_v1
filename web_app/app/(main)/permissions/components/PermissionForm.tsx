'use client';

import { FormEvent, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Permission } from '../models/permission.model';
import { ItemFormRenderProps } from '@/components/ItemManager';

type FormValues = Pick<Permission, 'category' | 'name' | 'description'>;

const FIELDS: { key: keyof FormValues; label: string }[] = [
    { key: 'category', label: 'Category' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
];

const PermissionForm = ({ item, saving, formId, onSubmit }: ItemFormRenderProps<Permission>) => {
    // The form is only mounted while the dialog is open, so the initial state
    // is fresh on every open and no reset effects are needed.
    const [values, setValues] = useState<FormValues>({
        category: item?.category ?? '',
        name: item?.name ?? '',
        description: item?.description ?? '',
    });
    const [submitted, setSubmitted] = useState(false);

    const errors: Partial<Record<keyof FormValues, string>> = {};
    for (const { key, label } of FIELDS) {
        if (!values[key].trim()) errors[key] = `${label} is required`;
    }
    const isValid = Object.keys(errors).length === 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (!isValid || saving) return;

        // ItemManager adds the id when editing and handles API errors
        await onSubmit({
            category: values.category.trim(),
            name: values.name.trim(),
            description: values.description.trim(),
        });
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {FIELDS.map(({ key, label }) => {
                const invalid = submitted && !!errors[key];
                return (
                    <div className="field" key={key}>
                        <label htmlFor={key}>{label}</label>
                        <InputText
                            id={key}
                            value={values[key]}
                            disabled={saving}
                            onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                            className={classNames({ 'p-invalid': invalid })}
                        />
                        {invalid && <small className="p-error">{errors[key]}</small>}
                    </div>
                );
            })}
        </form>
    );
};

export default PermissionForm;
