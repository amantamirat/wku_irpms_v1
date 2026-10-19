'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { extractId } from '@/utils/utils';

import {
    Publication,
    PublicationType,
    validatePublication
} from '../models/publication.model';

import { User } from '../../models/user.model';
import { UserApi } from '../../api/user.api';

const PublicationForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Publication>) => {
    const [localPublication, setLocalPublication] =
        useState<Publication>(() => ({ ...item }));

    const [submitted, setSubmitted] = useState(false);
    const [users, setUsers] = useState<User[]>([]);

    const isAuthorPredefined = !!item?.author;

    /**
     * Sync form state when the selected item changes.
     */
    useEffect(() => {
        setLocalPublication({ ...item });
        setSubmitted(false);
    }, [item]);

    /**
     * Load authors only when the author is not predefined.
     */
    useEffect(() => {
        let cancelled = false;

        const loadUsers = async () => {
            if (isAuthorPredefined) {
                setUsers([]);
                return;
            }

            try {
                const result = await UserApi.lookup!({});

                if (!cancelled) {
                    setUsers(result);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        'Error loading publication authors:',
                        error
                    );
                }
            }
        };

        void loadUsers();

        return () => {
            cancelled = true;
        };
    }, [isAuthorPredefined]);

    /**
     * Update a single publication field.
     */
    const updateField = <K extends keyof Publication>(
        key: K,
        value: Publication[K]
    ) => {
        setLocalPublication((previous) => ({
            ...previous,
            [key]: value
        }));
    };

    /**
     * Normalize author reference before submitting.
     */
    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const normalizedPublication: Publication = {
            ...localPublication,
            author: extractId(
                localPublication.author
            ) as Publication['author']
        };

        const result = validatePublication(normalizedPublication);

        if (!result.valid) return;

        await onSubmit(normalizedPublication);
    };

    const validation = submitted
        ? validatePublication(localPublication)
        : undefined;

    const fieldInvalid = (field: keyof Publication) => {
        if (!submitted) return false;

        switch (field) {
            case 'author':
                return !extractId(localPublication.author);

            case 'title':
                return !localPublication.title?.trim();

            case 'type':
                return !localPublication.type;

            case 'publishedDate':
                return !localPublication.publishedDate;

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
            {/* Author */}
            <div className="field col-12">
                <label
                    htmlFor="publication-author"
                    className="font-medium text-900 block mb-2"
                >
                    Author <span className="text-red-500">*</span>
                </label>

                {isAuthorPredefined ? (
                    <InputText
                        id="publication-author"
                        value={
                            typeof localPublication.author === 'object'
                                ? (localPublication.author as User).name ?? ''
                                : 'Linked Author'
                        }
                        disabled
                        className="w-full"
                    />
                ) : (
                    <Dropdown
                        id="publication-author"
                        value={extractId(localPublication.author)}
                        options={users}
                        optionLabel="name"
                        optionValue="_id"
                        onChange={(e) =>
                            updateField(
                                'author',
                                e.value as Publication['author']
                            )
                        }
                        placeholder="Select Author"
                        showClear
                        filter
                        className={classNames('w-full', {
                            'p-invalid': fieldInvalid('author')
                        })}
                    />
                )}

                {fieldInvalid('author') && (
                    <small className="p-error block mt-1">
                        Author is required.
                    </small>
                )}
            </div>

            {/* Title */}
            <div className="field col-12">
                <label
                    htmlFor="publication-title"
                    className="font-medium text-900 block mb-2"
                >
                    Title <span className="text-red-500">*</span>
                </label>

                <InputText
                    id="publication-title"
                    value={localPublication.title ?? ''}
                    onChange={(e) =>
                        updateField('title', e.target.value)
                    }
                    placeholder="Full title of the publication"
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('title')
                    })}
                />

                {fieldInvalid('title') && (
                    <small className="p-error block mt-1">
                        Title is required.
                    </small>
                )}
            </div>

            {/* Publication Type */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="publication-type"
                    className="font-medium text-900 block mb-2"
                >
                    Type <span className="text-red-500">*</span>
                </label>

                <Dropdown
                    id="publication-type"
                    value={localPublication.type}
                    options={Object.values(PublicationType).map(
                        (type) => ({
                            label: type,
                            value: type
                        })
                    )}
                    onChange={(e) =>
                        updateField(
                            'type',
                            e.value as Publication['type']
                        )
                    }
                    placeholder="Select Publication Type"
                    showClear
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('type')
                    })}
                />

                {fieldInvalid('type') && (
                    <small className="p-error block mt-1">
                        Publication type is required.
                    </small>
                )}
            </div>

            {/* Published Date */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="publication-date"
                    className="font-medium text-900 block mb-2"
                >
                    Publication Date <span className="text-red-500">*</span>
                </label>

                <Calendar
                    id="publication-date"
                    value={
                        localPublication.publishedDate
                            ? new Date(localPublication.publishedDate)
                            : null
                    }
                    onChange={(e) =>
                        updateField('publishedDate', e.value ?? undefined)
                    }
                    dateFormat="yy-mm-dd"
                    showIcon
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('publishedDate')
                    })}
                />

                {fieldInvalid('publishedDate') && (
                    <small className="p-error block mt-1">
                        Publication Date is required.
                    </small>
                )}
            </div>

            {/* DOI */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="publication-doi"
                    className="font-medium text-900 block mb-2"
                >
                    DOI
                </label>

                <InputText
                    id="publication-doi"
                    value={localPublication.doi ?? ''}
                    onChange={(e) =>
                        updateField('doi', e.target.value)
                    }
                    placeholder="e.g. 10.1000/xyz123"
                    className="w-full"
                />
            </div>

            {/* Publisher */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="publication-publisher"
                    className="font-medium text-900 block mb-2"
                >
                    Publisher / Journal
                </label>

                <InputText
                    id="publication-publisher"
                    value={localPublication.publisher ?? ''}
                    onChange={(e) =>
                        updateField('publisher', e.target.value)
                    }
                    placeholder="Name of journal or publishing house"
                    className="w-full"
                />
            </div>

            {/* Abstract */}
            <div className="field col-12">
                <label
                    htmlFor="publication-abstract"
                    className="font-medium text-900 block mb-2"
                >
                    Abstract
                </label>

                <InputTextarea
                    id="publication-abstract"
                    value={localPublication.abstract ?? ''}
                    onChange={(e) =>
                        updateField('abstract', e.target.value)
                    }
                    rows={4}
                    autoResize
                    placeholder="Brief summary of the publication..."
                    className="w-full"
                />
            </div>

            {/* Publication URL */}
            <div className="field col-12">
                <label
                    htmlFor="publication-url"
                    className="font-medium text-900 block mb-2"
                >
                    Publication URL
                </label>

                <InputText
                    id="publication-url"
                    value={localPublication.url ?? ''}
                    onChange={(e) =>
                        updateField('url', e.target.value)
                    }
                    placeholder="https://..."
                    className="w-full"
                />
            </div>

            {/* Publication ID */}
            <div className="field col-12">
                <label
                    htmlFor="publication-id"
                    className="font-medium text-900 block mb-2"
                >
                    ID / ISBN
                </label>

                <InputText
                    id="publication-id"
                    value={localPublication.publicationId ?? ''}
                    onChange={(e) =>
                        updateField('publicationId', e.target.value)
                    }
                    placeholder="Volume / Issue / ISBN"
                    className="w-full"
                />
            </div>

            {/* Model validation message */}
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

export default PublicationForm;