'use client';

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useEffect, useRef, useState } from "react";

import { EntitySaveDialogProps } from "@/components/createEntityManager";
import {
    IDocumentTemplate,
    DocumentTemplateType,
    TemplateEngine,
    DocumentTemplateStatus,
    AGREEMENT_VARIABLES,
    CERTIFICATE_VARIABLES
} from "../models/documentTemplate.model";
import { DocumentTemplateApi } from "../api/documentTemplate.api";

const documentTypeOptions = [
    { label: 'Agreement', value: DocumentTemplateType.AGREEMENT },
    { label: 'Certificate', value: DocumentTemplateType.CERTIFICATE }
];

const engineOptions = [
    { label: 'Handlebars', value: TemplateEngine.HANDLEBARS },
    // { label: 'Carbon', value: TemplateEngine.CARBON },
    // { label: 'Puppeteer', value: TemplateEngine.PUPPETEER }
];

const statusOptions = [
    { label: 'Draft', value: DocumentTemplateStatus.DRAFT },
    { label: 'Active', value: DocumentTemplateStatus.ACTIVE },
    { label: 'Archived', value: DocumentTemplateStatus.ARCHIVED }
];

const SaveDocumentTemplate = ({
    visible,
    item,
    onHide,
    onComplete
}: EntitySaveDialogProps<IDocumentTemplate>) => {

    const toast = useRef<Toast>(null);
    const [localTemplate, setLocalTemplate] = useState<IDocumentTemplate>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    const isEditMode = !!item?._id;

    useEffect(() => {
        if (visible) {
            setLocalTemplate({ ...item, status: item.status || DocumentTemplateStatus.DRAFT });
            setSubmitted(false);
        }
    }, [item, visible]);

    const handleTypeChange = (newType: DocumentTemplateType) => {
        setLocalTemplate({
            ...localTemplate,
            type: newType,
            variables: newType === DocumentTemplateType.AGREEMENT ? AGREEMENT_VARIABLES : CERTIFICATE_VARIABLES
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLocalTemplate({ ...localTemplate, file });
        }
    };

    const validate = () => {
        if (!localTemplate.name || localTemplate.name.trim() === '') return { valid: false, message: "Template Name is required" };
        if (!localTemplate.type) return { valid: false, message: "Template Type is required" };
        if (!isEditMode && !localTemplate.file) return { valid: false, message: "HBS Template file is required" };
        return { valid: true };
    };

    const saveTemplate = async () => {
        setSubmitted(true);
        const validation = validate();

        if (!validation.valid) {
            toast.current?.show({ severity: 'warn', summary: 'Validation', detail: validation.message });
            return;
        }

        try {
            // If sending files, you typically use FormData in your API layer
            const saved = localTemplate._id
                ? await DocumentTemplateApi.update(localTemplate)
                : await DocumentTemplateApi.create(localTemplate);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Document Template saved successfully' });

            if (onComplete) {
                onComplete(saved);
            }
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to save template' });
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} className="p-button-secondary" />
            <Button label={isEditMode ? "Update Template" : "Create Template"} icon="pi pi-check" onClick={saveTemplate} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '550px' }}
                header={isEditMode ? 'Edit Document Template' : 'Create Document Template'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="grid">
                    {/* Template Name */}
                    <div className="field col-12 mt-2">
                        <label htmlFor="name" className="font-bold">Template Name</label>
                        <InputText
                            id="name"
                            value={localTemplate.name || ''}
                            onChange={(e) => setLocalTemplate({ ...localTemplate, name: e.target.value })}
                            placeholder="Enter template name..."
                            className={classNames({ 'p-invalid': submitted && !localTemplate.name })}
                        />
                        {submitted && !localTemplate.name && (
                            <small className="p-error">Template Name is required.</small>
                        )}
                    </div>

                    {/* Template Type */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="type" className="font-bold">Template Type</label>
                        <Dropdown
                            id="type"
                            value={localTemplate.type}
                            options={documentTypeOptions}
                            onChange={(e) => handleTypeChange(e.value)}
                            placeholder="Select Type"
                            className={classNames({ 'p-invalid': submitted && !localTemplate.type })}
                        />
                        {submitted && !localTemplate.type && (
                            <small className="p-error">Template Type is required.</small>
                        )}
                    </div>

                    {/* Template Engine */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="engine" className="font-bold">Template Engine</label>
                        <Dropdown
                            id="engine"
                            value={localTemplate.engine}
                            options={engineOptions}
                            onChange={(e) => setLocalTemplate({ ...localTemplate, engine: e.value })}
                            placeholder="Select Engine"
                        />
                    </div>

                    {/* File Upload for .hbs */}
                    <div className="field col-12">
                        <label htmlFor="file" className="font-bold">Upload HBS Template File (.hbs)</label>
                        <div className="flex flex-column gap-2">
                            <input
                                id="file"
                                type="file"
                                accept=".hbs"
                                onChange={handleFileChange}
                                className={classNames('p-inputtext p-component', { 'p-invalid': submitted && !isEditMode && !localTemplate.file })}
                            />
                            {localTemplate.file && (
                                <small className="text-green-600">Selected file: {localTemplate.file.name}</small>
                            )}
                        </div>
                        {submitted && !isEditMode && !localTemplate.file && (
                            <small className="p-error">HBS Template file is required.</small>
                        )}
                    </div>

                    {/* Status (Disabled for now) */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="status" className="font-bold">Status</label>
                        <Dropdown
                            id="status"
                            value={localTemplate.status || DocumentTemplateStatus.DRAFT}
                            options={statusOptions}
                            disabled
                            placeholder="Draft"
                        />
                    </div>

                    {/* Version */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="version" className="font-bold">Version</label>
                        <InputText
                            id="version"
                            type="number"
                            value={String(localTemplate.version || 1)}
                            onChange={(e) => setLocalTemplate({ ...localTemplate, version: Number(e.target.value) })}
                        />
                    </div>

                    {/* Description */}
                    <div className="field col-12">
                        <label htmlFor="description" className="font-bold">Description</label>
                        <InputTextarea
                            id="description"
                            rows={3}
                            value={localTemplate.description || ''}
                            onChange={(e) => setLocalTemplate({ ...localTemplate, description: e.target.value })}
                            placeholder="Enter description..."
                        />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveDocumentTemplate;