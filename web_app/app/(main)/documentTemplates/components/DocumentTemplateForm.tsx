'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';

import {
    IDocumentTemplate,
    DocumentTemplateType,
    TemplateEngine,
    DocumentTemplateStatus,
    AGREEMENT_VARIABLES,
    CERTIFICATE_VARIABLES
} from '../models/documentTemplate.model';

const documentTypeOptions = [
    { label: 'Agreement', value: DocumentTemplateType.AGREEMENT },
    { label: 'Certificate', value: DocumentTemplateType.CERTIFICATE }
];

const engineOptions = [
    { label: 'Handlebars', value: TemplateEngine.HANDLEBARS }
];

const statusOptions = [
    { label: 'Draft', value: DocumentTemplateStatus.DRAFT },
    { label: 'Active', value: DocumentTemplateStatus.ACTIVE },
    { label: 'Archived', value: DocumentTemplateStatus.ARCHIVED }
];

const DocumentTemplateForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<IDocumentTemplate>) => {

    const [localTemplate, setLocalTemplate] =
        useState<IDocumentTemplate>(() => ({
            ...item,

        }));

    const [submitted, setSubmitted] = useState(false);

    const isEditMode = !!item?._id;

    /**
     * Sync the form when the selected template changes.
     */
    useEffect(() => {
        setLocalTemplate({
            ...item
        });
        setSubmitted(false);
    }, [item]);

    /**
     * Update a single template field.
     */
    const updateField = <K extends keyof IDocumentTemplate>(
        key: K,
        value: IDocumentTemplate[K]
    ) => {
        setLocalTemplate((previous) => ({
            ...previous,
            [key]: value
        }));
    };

    /**
     * Update the template type and its default variables.
     */
    const handleTypeChange = (type: DocumentTemplateType) => {
        setLocalTemplate((previous) => ({
            ...previous,
            type,
            variables:
                type === DocumentTemplateType.AGREEMENT
                    ? AGREEMENT_VARIABLES
                    : CERTIFICATE_VARIABLES
        }));
    };

    /**
     * Handle .hbs file selection.
     */
    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.hbs')) {
            event.target.value = '';
            return;
        }

        updateField('file', file as IDocumentTemplate['file']);
    };

    /**
     * Validate and submit the form.
     */
    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        if (!localTemplate.name?.trim()) return;
        if (!localTemplate.type) return;
        if (!isEditMode && !localTemplate.file) return;

        await onSubmit({
            ...localTemplate,
            name: localTemplate.name.trim(),
            status: localTemplate.status || DocumentTemplateStatus.DRAFT,
            version: Number(localTemplate.version) || 1
        });
    };

    const nameInvalid =
        submitted && !localTemplate.name?.trim();

    const typeInvalid =
        submitted && !localTemplate.type;

    const fileInvalid =
        submitted && !isEditMode && !localTemplate.file;

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="formgrid grid p-fluid"
            noValidate
        >
            {/* Template Name */}
            <div className="field col-12">
                <label
                    htmlFor="document-template-name"
                    className="font-medium text-900 block mb-2"
                >
                    Template Name
                    <span className="text-red-500"> *</span>
                </label>

                <InputText
                    id="document-template-name"
                    value={localTemplate.name || ''}
                    onChange={(event) =>
                        updateField('name', event.target.value)
                    }
                    placeholder="Enter template name"
                    className={classNames('w-full', {
                        'p-invalid': nameInvalid
                    })}
                />

                {nameInvalid && (
                    <small className="p-error block mt-1">
                        Template name is required.
                    </small>
                )}
            </div>

            {/* Template Type */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="document-template-type"
                    className="font-medium text-900 block mb-2"
                >
                    Template Type
                    <span className="text-red-500"> *</span>
                </label>

                <Dropdown
                    id="document-template-type"
                    value={localTemplate.type}
                    options={documentTypeOptions}
                    onChange={(event) =>
                        handleTypeChange(event.value)
                    }
                    placeholder="Select Template Type"
                    showClear
                    className={classNames('w-full', {
                        'p-invalid': typeInvalid
                    })}
                />

                {typeInvalid && (
                    <small className="p-error block mt-1">
                        Template type is required.
                    </small>
                )}
            </div>

            {/* Template Engine */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="document-template-engine"
                    className="font-medium text-900 block mb-2"
                >
                    Template Engine
                </label>

                <Dropdown
                    id="document-template-engine"
                    value={localTemplate.engine}
                    options={engineOptions}
                    onChange={(event) =>
                        updateField(
                            'engine',
                            event.value as TemplateEngine
                        )
                    }
                    placeholder="Select Engine"
                    className="w-full"
                />
            </div>

            {/* HBS File */}
            <div className="field col-12">
                <label
                    htmlFor="document-template-file"
                    className="font-medium text-900 block mb-2"
                >
                    Handlebars Template File (.hbs)
                    {!isEditMode && (
                        <span className="text-red-500"> *</span>
                    )}
                </label>

                <input
                    id="document-template-file"
                    type="file"
                    accept=".hbs"
                    onChange={handleFileChange}
                    className={classNames(
                        'p-inputtext p-component w-full',
                        {
                            'p-invalid': fileInvalid
                        }
                    )}
                />

                {localTemplate.file && (
                    <small className="block mt-2 text-green-600">
                        <i className="pi pi-file mr-1" />
                        Selected file:{' '}
                        {localTemplate.file instanceof File
                            ? localTemplate.file.name
                            : String(localTemplate.file)}
                    </small>
                )}

                {fileInvalid && (
                    <small className="p-error block mt-1">
                        An HBS template file is required.
                    </small>
                )}

                {isEditMode && !localTemplate.file && (
                    <small className="text-500 block mt-1">
                        Leave empty to retain the existing template file.
                    </small>
                )}
            </div>

            {/* Status */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="document-template-status"
                    className="font-medium text-900 block mb-2"
                >
                    Status
                </label>

                <Dropdown
                    id="document-template-status"
                    value={
                        localTemplate.status ||
                        DocumentTemplateStatus.DRAFT
                    }
                    options={statusOptions}
                    disabled
                    className="w-full"
                />
            </div>

            {/* Version */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="document-template-version"
                    className="font-medium text-900 block mb-2"
                >
                    Version
                </label>

                <InputText
                    id="document-template-version"
                    type="number"
                    min={1}
                    value={String(localTemplate.version || 1)}
                    onChange={(event) =>
                        updateField(
                            'version',
                            Number(event.target.value) as IDocumentTemplate['version']
                        )
                    }
                    className="w-full"
                />
            </div>

            {/* Description */}
            <div className="field col-12">
                <label
                    htmlFor="document-template-description"
                    className="font-medium text-900 block mb-2"
                >
                    Description
                </label>

                <InputTextarea
                    id="document-template-description"
                    rows={3}
                    autoResize
                    value={localTemplate.description || ''}
                    onChange={(event) =>
                        updateField('description', event.target.value)
                    }
                    placeholder="Enter template description"
                    className="w-full"
                />
            </div>
        </form>
    );
};

export default DocumentTemplateForm;
