'use client';

import { FormEvent, useState } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Theme } from '../models/theme.model';

const ThemeForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Theme>) => {
    // The form is mounted while the dialog is open, so state starts fresh.
    const [initial] = useState<Theme>(
        () => item ?? { title: '', priority: 0 } as Theme
    );

    const [localTheme, setLocalTheme] = useState<Theme>({ ...initial });
    const [submitted, setSubmitted] = useState(false);

    const titleMissing = !localTheme.title?.trim();
    const priorityMissing =
        localTheme.priority == null || localTheme.priority < 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (titleMissing || priorityMissing) return;

        await onSubmit({
            ...localTheme,
            title: localTheme.title.trim()
        });
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid"
            noValidate
        >
            {/* Title */}
            <div className="field mb-4">
                <label
                    htmlFor="title"
                    className="font-bold text-sm block mb-2"
                >
                    Title <span className="text-red-500">*</span>
                </label>

                <InputText
                    id="title"
                    value={localTheme.title ?? ''}
                    onChange={(e) =>
                        setLocalTheme({
                            ...localTheme,
                            title: e.target.value
                        })
                    }
                    disabled={saving}
                    required
                    autoFocus
                    placeholder="Enter theme title"
                    className={classNames({
                        'p-invalid': submitted && titleMissing
                    })}
                />

                {submitted && titleMissing && (
                    <small className="p-error">
                        Title is required.
                    </small>
                )}
            </div>

            {/* Priority */}
            <div className="field mb-4">
                <label
                    htmlFor="priority"
                    className="font-bold text-sm block mb-2"
                >
                    Priority <span className="text-red-500">*</span>
                </label>

                <InputNumber
                    id="priority"
                    value={localTheme.priority ?? null}
                    onValueChange={(e) =>
                        setLocalTheme({
                            ...localTheme,
                            priority: e.value ?? 0
                        })
                    }
                    min={0}
                    disabled={saving}
                    placeholder="Enter priority"
                    className={classNames({
                        'p-invalid': submitted && priorityMissing
                    })}
                />

                {submitted && priorityMissing && (
                    <small className="p-error">
                        Priority must be zero or greater.
                    </small>
                )}
            </div>
        </form>
    );
};

export default ThemeForm;