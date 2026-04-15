'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';

import {
    Template,
    Field,
    Section,
    validateTemplate,
    sanitizeTemplate
} from '../models/template.model';

import { TemplateApi } from '../api/template.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

/* ---------------------------------- CONSTANTS ---------------------------------- */

const fieldTypeOptions = [
    { label: 'Text', value: 'text' },
    { label: 'Textarea', value: 'textarea' },
    { label: 'Number', value: 'number' },
    { label: 'File Upload', value: 'file' }
];

/* -------------------------------- COMPONENT -------------------------------- */

const SaveTemplate = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<Template>) => {

    const toast = useRef<Toast>(null);

    const [template, setTemplate] = useState<Template>({
        ...item,
        sections: item.sections || []
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTemplate({
            ...item,
            sections: item.sections || []
        });
        setSubmitted(false);
    }, [item]);

    /* ---------------- SECTION HANDLERS ---------------- */

    const addSection = () => {
        const newSection: Section = {
            title: '',
            description: '',
            order: template.sections.length,
            isRequired: true,
            fields: []
        };

        setTemplate(prev => ({
            ...prev,
            sections: [...prev.sections, newSection]
        }));
    };

    const removeSection = (index: number) => {
        setTemplate(prev => ({
            ...prev,
            sections: prev.sections.filter((_, i) => i !== index)
        }));
    };

    const updateSection = (index: number, key: keyof Section, value: any) => {
        const updated = [...template.sections];
        updated[index] = { ...updated[index], [key]: value };

        setTemplate(prev => ({ ...prev, sections: updated }));
    };

    /* ---------------- FIELD HANDLERS ---------------- */

    const addField = (sectionIndex: number) => {
        const updated = [...template.sections];

        const newField: Field = {
            label: '',
            fieldType: 'text',
            order: updated[sectionIndex].fields.length,
            isRequired: false,
            placeholder: ''
        };

        updated[sectionIndex].fields.push(newField);

        setTemplate(prev => ({ ...prev, sections: updated }));
    };

    const updateField = (
        sectionIndex: number,
        fieldIndex: number,
        key: keyof Field,
        value: any
    ) => {
        const updated = [...template.sections];
        updated[sectionIndex].fields[fieldIndex] = {
            ...updated[sectionIndex].fields[fieldIndex],
            [key]: value
        };

        setTemplate(prev => ({ ...prev, sections: updated }));
    };

    const removeField = (sectionIndex: number, fieldIndex: number) => {
        const updated = [...template.sections];
        updated[sectionIndex].fields = updated[sectionIndex].fields.filter(
            (_, i) => i !== fieldIndex
        );

        setTemplate(prev => ({ ...prev, sections: updated }));
    };

    /* ---------------- SAVE ---------------- */

    const saveTemplate = async () => {
        setSubmitted(true);

        const validation = validateTemplate(template);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: validation.message
            });
            return;
        }

        try {
            setLoading(true);

            const clean = sanitizeTemplate(template) as Template;

            const response = template._id
                ? await TemplateApi.update(clean)
                : await TemplateApi.create(clean);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Template saved successfully'
            });

            onComplete?.(response);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Something went wrong'
            });
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- FOOTER ---------------- */

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                onClick={onHide}
                disabled={loading}
            />
            <Button
                label="Save Template"
                icon="pi pi-check"
                onClick={saveTemplate}
                loading={loading}
            />
        </div>
    );

    /* ---------------- UI ---------------- */

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                header={template._id ? 'Edit Template' : 'Create Template'}
                modal
                style={{ width: '900px' }}
                className="p-fluid"
                footer={footer}
                onHide={onHide}
                maximizable
            >

                {/* BASIC INFO */}
                <div className="mb-4">
                    <h5 className="mb-3">Basic Information</h5>

                    <div className="field">
                        <label className="font-medium">Template Name *</label>
                        <InputText
                            value={template.name}
                            onChange={(e) =>
                                setTemplate({ ...template, name: e.target.value })
                            }
                            className={classNames({
                                'p-invalid': submitted && !template.name
                            })}
                            placeholder="e.g., Research Proposal Template"
                        />
                    </div>

                    <div className="field">
                        <label>Description</label>
                        <InputTextarea
                            value={template.description}
                            onChange={(e) =>
                                setTemplate({
                                    ...template,
                                    description: e.target.value
                                })
                            }
                            rows={3}
                        />
                    </div>
                </div>

                {/* SECTIONS */}
                <div>
                    <div className="flex justify-content-between align-items-center mb-3">
                        <h5 className="m-0">Sections</h5>

                        <Button
                            icon="pi pi-plus"
                            label="Add"
                            className="p-button-sm p-button-outlined"
                            onClick={addSection}
                        />
                    </div>

                    <Accordion multiple>
                        {template.sections.map((section, sIdx) => (
                            <AccordionTab
                                key={sIdx}
                                header={
                                    <div className="flex justify-content-between align-items-center w-full pr-2">
                                        <span className="font-medium">
                                            {section.title || `Section ${sIdx + 1}`}
                                        </span>

                                        <Button
                                            icon="pi pi-trash"
                                            className="p-button-rounded p-button-text p-button-danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSection(sIdx);
                                            }}
                                        />
                                    </div>
                                }
                            >

                                {/* SECTION INFO */}
                                <div className="formgrid grid mb-3">
                                    <div className="field col">
                                        <label>Title *</label>
                                        <InputText
                                            value={section.title}
                                            onChange={(e) =>
                                                updateSection(sIdx, 'title', e.target.value)
                                            }
                                            className={classNames({
                                                'p-invalid': submitted && !section.title
                                            })}
                                        />
                                    </div>

                                    <div className="field col-fixed flex align-items-center mt-4">
                                        <Checkbox
                                            checked={section.isRequired || false}
                                            onChange={(e) =>
                                                updateSection(sIdx, 'isRequired', e.checked)
                                            }
                                        />
                                        <label className="ml-2">Required</label>
                                    </div>
                                </div>

                                {/* FIELDS */}
                                <DataTable
                                    value={section.fields}
                                    responsiveLayout="scroll"
                                    className="p-datatable-sm"
                                    emptyMessage="No fields added."
                                >
                                    <Column
                                        header="Label"
                                        body={(_, { rowIndex }) => (
                                            <InputText
                                                value={section.fields[rowIndex].label}
                                                onChange={(e) =>
                                                    updateField(
                                                        sIdx,
                                                        rowIndex,
                                                        'label',
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        )}
                                    />

                                    <Column
                                        header="Type"
                                        style={{ width: '180px' }}
                                        body={(_, { rowIndex }) => (
                                            <Dropdown
                                                value={section.fields[rowIndex].fieldType}
                                                options={fieldTypeOptions}
                                                onChange={(e) =>
                                                    updateField(
                                                        sIdx,
                                                        rowIndex,
                                                        'fieldType',
                                                        e.value
                                                    )
                                                }
                                            />
                                        )}
                                    />

                                    <Column
                                        header="Req"
                                        style={{ width: '70px' }}
                                        body={(_, { rowIndex }) => (
                                            <Checkbox
                                                checked={
                                                    section.fields[rowIndex].isRequired || false
                                                }
                                                onChange={(e) =>
                                                    updateField(
                                                        sIdx,
                                                        rowIndex,
                                                        'isRequired',
                                                        e.checked
                                                    )
                                                }
                                            />
                                        )}
                                    />

                                    <Column
                                        style={{ width: '60px' }}
                                        body={(_, { rowIndex }) => (
                                            <Button
                                                icon="pi pi-times"
                                                className="p-button-text p-button-danger"
                                                onClick={() =>
                                                    removeField(sIdx, rowIndex)
                                                }
                                            />
                                        )}
                                    />
                                </DataTable>

                                <Button
                                    icon="pi pi-plus"
                                    label="Add Field"
                                    className="p-button-text p-button-sm mt-2"
                                    onClick={() => addField(sIdx)}
                                />
                            </AccordionTab>
                        ))}
                    </Accordion>

                    {submitted && template.sections.length === 0 && (
                        <small className="p-error block mt-2">
                            At least one section is required.
                        </small>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SaveTemplate;