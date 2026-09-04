'use client';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Chips } from 'primereact/chips';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Template, TemplateSection, validateTemplate } from '../models/template.model';
import { TemplateApi } from '../api/template.api';

const normalizeTemplate = (template?: Partial<Template>): Template => ({
    ...template,
    name: template?.name ?? '',
    description: template?.description ?? '',
    minPages: template?.minPages ?? undefined,
    maxPages: template?.maxPages ?? undefined,
    sections: template?.sections ?? []
});

const SaveTemplate = (props: EntitySaveDialogProps<Template>) => {
    const { visible, item, onComplete, onHide } = props;

    const toast = useRef<Toast>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [localTemplate, setLocalTemplate] = useState<Template>(() => normalizeTemplate(item));

    const isEdit = !!localTemplate._id;

    useEffect(() => {
        if (visible) {
            setLocalTemplate(normalizeTemplate(item));
            setSubmitted(false);
        }
    }, [item, visible]);

    const addSection = () => {
        const newSection: TemplateSection = {
            name: '',
            aliases: [],
            required: true,
            guidelines: '',
            order: (localTemplate.sections?.length || 0) + 1
        };
        setLocalTemplate(prev => ({
            ...prev,
            sections: [...(prev.sections || []), newSection]
        }));
    };

    const removeSection = (index: number) => {
        setLocalTemplate(prev => {
            const updated = (prev.sections || []).filter((_, i) => i !== index);
            const reordered = updated.map((sec, i) => ({ ...sec, order: i + 1 }));
            return { ...prev, sections: reordered };
        });
    };

    const updateSection = (index: number, fields: Partial<TemplateSection>) => {
        setLocalTemplate(prev => {
            const updated = [...(prev.sections || [])];
            updated[index] = { ...updated[index], ...fields };
            return { ...prev, sections: updated };
        });
    };

    const handleSave = async () => {
        setSubmitted(true);
        const validation = validateTemplate(localTemplate);
        if (!validation.valid) {
            toast.current?.show({ severity: 'warn', summary: 'Validation Error', detail: validation.message });
            return;
        }

        setLoading(true);
        try {
            const saved = isEdit
                ? await TemplateApi.update(localTemplate)
                : await TemplateApi.create(localTemplate);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Template saved successfully' });
            onComplete?.(saved);
            onHide();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Save Failed', detail: err.message || 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} disabled={loading} />
            <Button label="Save Template" icon="pi pi-save" onClick={handleSave} loading={loading} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className={`pi ${isEdit ? 'pi-file-edit' : 'pi-file-import'} text-primary`}></i>
                        <span>{isEdit ? 'Modify Template' : 'Create Document Template'}</span>
                    </div>
                }
                style={{ width: '800px' }}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
                maximizable
            >
                {/* Template Meta */}
                <div className="field mb-3">
                    <label className="font-bold text-sm block mb-2">Template Title *</label>
                    <InputText
                        value={localTemplate.name || ''}
                        placeholder="e.g. Project Proposal / Research Spec"
                        onChange={(e) => setLocalTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className={classNames({ 'p-invalid': submitted && !localTemplate.name?.trim() })}
                    />
                    {submitted && !localTemplate.name?.trim() && (
                        <small className="p-error">Template name is required.</small>
                    )}
                </div>

                <div className="field mb-3">
                    <label className="font-bold text-sm block mb-2">Description</label>
                    <InputTextarea
                        rows={2}
                        value={localTemplate.description || ''}
                        placeholder="Brief summary of what this document structure validates..."
                        onChange={(e) => setLocalTemplate(prev => ({ ...prev, description: e.target.value }))}
                    />
                </div>

                {/* Min / Max Pages */}
                <div className="grid p-fluid mb-4">
                    <div className="col-6 field mb-0">
                        <label className="font-bold text-sm block mb-2">Min Pages</label>
                        <InputNumber
                            value={localTemplate.minPages ?? null}
                            onValueChange={(e) => setLocalTemplate(prev => ({
                                ...prev,
                                minPages: e.value !== null && e.value !== undefined ? e.value : undefined
                            }))}
                            placeholder="Optional"
                            min={0}
                        />
                    </div>
                    <div className="col-6 field mb-0">
                        <label className="font-bold text-sm block mb-2">Max Pages</label>
                        <InputNumber
                            value={localTemplate.maxPages ?? null}
                            onValueChange={(e) => setLocalTemplate(prev => ({
                                ...prev,
                                maxPages: e.value !== null && e.value !== undefined ? e.value : undefined
                            }))}
                            placeholder="Optional"
                            min={0}
                        />
                    </div>
                </div>

                {/* Section Header Bar */}
                <div className="flex align-items-center justify-content-between mb-3 border-bottom-1 surface-border pb-2">
                    <span className="font-bold text-lg">Expected Sections</span>
                    <Button
                        type="button"
                        label="Add Section"
                        icon="pi pi-plus"
                        size="small"
                        severity="secondary"
                        outlined
                        onClick={addSection}
                    />
                </div>

                {/* Section Cards */}
                {(!localTemplate.sections || localTemplate.sections.length === 0) && (
                    <div className="text-center p-4 surface-100 border-round text-500">
                        No sections defined. Click &quot;Add Section&quot; to specify expected PDF headers.
                    </div>
                )}

                <div className="flex flex-column gap-3">
                    {localTemplate.sections?.map((section, idx) => (
                        <div key={idx} className="p-3 surface-card border-1 surface-border border-round">
                            <div className="grid p-fluid">
                                {/* Header Name */}
                                <div className="col-12 md:col-8 field mb-2">
                                    <label className="text-xs font-bold block mb-1">Section Header *</label>
                                    <InputText
                                        value={section.name || ''}
                                        placeholder="e.g. Methodology & Implementation"
                                        onChange={(e) => updateSection(idx, { name: e.target.value })}
                                        className={classNames({ 'p-invalid': submitted && !section.name?.trim() })}
                                    />
                                </div>

                                {/* Order & Required */}
                                <div className="col-12 md:col-4 flex align-items-center justify-content-between pt-3">
                                    <div className="flex align-items-center">
                                        <Checkbox
                                            inputId={`req-${idx}`}
                                            checked={!!section.required}
                                            onChange={(e) => updateSection(idx, { required: e.checked ?? false })}
                                        />
                                        <label htmlFor={`req-${idx}`} className="ml-2 text-xs font-bold cursor-pointer">Required</label>
                                    </div>
                                    <Button
                                        icon="pi pi-trash"
                                        severity="danger"
                                        text
                                        rounded
                                        type="button"
                                        onClick={() => removeSection(idx)}
                                    />
                                </div>

                                {/* Header Aliases */}
                                <div className="col-12 field mb-2">
                                    <label className="text-xs font-bold block mb-1">Header Aliases / Synonyms (Press Enter)</label>
                                    <Chips
                                        value={section.aliases || []}
                                        onChange={(e) => updateSection(idx, { aliases: e.value || [] })}
                                        placeholder="e.g. 'Methods', 'Experimental Design'"
                                    />
                                </div>

                                {/* Guidelines for LLM Validation */}
                                {
                                    /**
                                     * <div className="col-12 field mb-2">
                                    <label className="text-xs font-bold block mb-1">
                                        <i className="pi pi-sparkles text-primary mr-1"></i>
                                        Validation Guidelines (AI Prompt)
                                    </label>
                                    <InputText
                                        value={section.guidelines || ''}
                                        placeholder="Instructions for AI (e.g., Must specify project timeline or budget breakdown)"
                                        onChange={(e) => updateSection(idx, { guidelines: e.target.value })}
                                    />
                                </div>
                                     */
                                }


                                {/* Min / Max Words */}
                                <div className="col-6 field mb-0">
                                    <label className="text-xs font-bold block mb-1">Min Word Count</label>
                                    <InputNumber
                                        value={section.minWords ?? null}
                                        onValueChange={(e) => updateSection(idx, { minWords: e.value !== null && e.value !== undefined ? e.value : undefined })}
                                        placeholder="Optional"
                                        min={0}
                                    />
                                </div>
                                <div className="col-6 field mb-0">
                                    <label className="text-xs font-bold block mb-1">Max Word Count</label>
                                    <InputNumber
                                        value={section.maxWords ?? null}
                                        onValueChange={(e) => updateSection(idx, { maxWords: e.value !== null && e.value !== undefined ? e.value : undefined })}
                                        placeholder="Optional"
                                        min={0}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Dialog>
        </>
    );
};

export default SaveTemplate;