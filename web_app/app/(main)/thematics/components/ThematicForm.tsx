'use client';

import { FormEvent, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { ItemFormRenderProps } from '@/components/ItemManager';
import { Thematic, ThemeLevel } from '../models/thematic.model';

const ThematicForm = ({
    mode,
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Thematic>) => {
    // The form is mounted when the dialog opens, so state starts fresh each time.
    const [initial] = useState<Thematic>(
        () => item ?? { title: '', level: ThemeLevel.broad }
    );

    const [localItem, setLocalItem] = useState<Thematic>({ ...initial });
    const [submitted, setSubmitted] = useState(false);

    // Level can only be changed when creating a new thematic.
    const isLevelDisabled = Boolean(localItem._id);

    const titleMissing = !localItem.title?.trim();
    const levelMissing = !localItem.level;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (titleMissing || levelMissing) return;

        await onSubmit({
            ...localItem,
            title: localItem.title.trim()
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
                    value={localItem.title ?? ''}
                    disabled={saving}
                    onChange={(e) =>
                        setLocalItem({
                            ...localItem,
                            title: e.target.value
                        })
                    }
                    required
                    autoFocus
                    placeholder="Enter thematic title"
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

            {/* Level */}
            <div className="field mb-4">
                <label
                    htmlFor="level"
                    className="font-bold text-sm block mb-2"
                >
                    Level <span className="text-red-500">*</span>
                </label>

                <Dropdown
                    id="level"
                    value={localItem.level}
                    options={Object.values(ThemeLevel).map((value) => ({
                        label: value,
                        value
                    }))}
                    onChange={(e) =>
                        setLocalItem({
                            ...localItem,
                            level: e.value
                        })
                    }
                    placeholder="Select thematic level"
                    disabled={saving || isLevelDisabled}
                    className={classNames({
                        'p-invalid': submitted && levelMissing
                    })}
                />

                {isLevelDisabled ? (
                    <small className="text-500 italic block mt-1">
                        Thematic level cannot be changed after creation.
                    </small>
                ) : (
                    submitted && levelMissing && (
                        <small className="p-error">
                            Please select a thematic level.
                        </small>
                    )
                )}
            </div>

            {/* Description */}
            <div className="field mb-4">
                <label
                    htmlFor="description"
                    className="font-bold text-sm block mb-2"
                >
                    Description
                </label>

                <InputTextarea
                    id="description"
                    value={localItem.description ?? ''}
                    disabled={saving}
                    onChange={(e) =>
                        setLocalItem({
                            ...localItem,
                            description: e.target.value
                        })
                    }
                    rows={4}
                    placeholder="Enter description (optional)"
                />
            </div>
        </form>
    );
};

export default ThematicForm;