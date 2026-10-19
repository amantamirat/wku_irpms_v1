'use client';

import { FormEvent, useState } from 'react';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Chips } from 'primereact/chips';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Template, TemplateSection, validateTemplate } from '../models/template.model';

const normalizeTemplate = (template?: Partial<Template>): Template => ({
    ...template,
    name: template?.name ?? '',
    description: template?.description ?? '',
    minPages: template?.minPages ?? undefined,
    maxPages: template?.maxPages ?? undefined,
    sections: template?.sections ?? []
} as Template);

const TemplateForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Template>) => {
    // ItemManager mounts the form when the dialog opens.
    const [initial] = useState<Template>(() => normalizeTemplate(item || undefined));
    const [localTemplate, setLocalTemplate] = useState<Template>(() =>
        normalizeTemplate(initial)
    );
    const [submitted, setSubmitted] = useState(false);

    const isEdit = Boolean(localTemplate._id);

    const addSection = () => {
        const newSection: TemplateSection = {
            name: '',
            aliases: [],
            required: true,
            guidelines: '',
            order: (localTemplate.sections?.length ?? 0) + 1
        };

        setLocalTemplate((prev) => ({
            ...prev,
            sections: [...(prev.sections ?? []), newSection]
        }));
    };

    const removeSection = (index: number) => {
        setLocalTemplate((prev) => ({
            ...prev,
            sections: (prev.sections ?? [])
                .filter((_, i) => i !== index)
                .map((section, i) => ({
                    ...section,
                    order: i + 1
                }))
        }));
    };

    const updateSection = (
        index: number,
        fields: Partial<TemplateSection>
    ) => {
        setLocalTemplate((prev) => {
            const sections = [...(prev.sections ?? [])];
            sections[index] = { ...sections[index], ...fields };

            return { ...prev, sections };
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const normalized = normalizeTemplate({
            ...localTemplate,
            name: localTemplate.name.trim(),
            sections: localTemplate.sections.map((section, index) => ({
                ...section,
                name: section.name.trim(),
                order: index + 1
            }))
        });

        const validation = validateTemplate(normalized);

        if (!validation.valid) return;

        await onSubmit(normalized);
    };

    const nameMissing = !localTemplate.name?.trim();

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid"
            noValidate
        >
            {/* Template Name */}
            <div className="field mb-3">
                <label
                    htmlFor="template-name"
                    className="font-bold text-sm block mb-2"
                >
                    Template Title <span className="text-red-500">*</span>
                </label>

                <InputText
                    id="template-name"
                    value={localTemplate.name}
                    placeholder="e.g. Project Proposal / Research Specification"
                    disabled={saving}
                    onChange={(e) =>
                        setLocalTemplate((prev) => ({
                            ...prev,
                            name: e.target.value
                        }))
                    }
                    autoFocus
                    className={classNames({
                        'p-invalid': submitted && nameMissing
                    })}
                />

                {submitted && nameMissing && (
                    <small className="p-error">
                        Template name is required.
                    </small>
                )}
            </div>

            {/* Description */}
            <div className="field mb-3">
                <label
                    htmlFor="template-description"
                    className="font-bold text-sm block mb-2"
                >
                    Description
                </label>

                <InputTextarea
                    id="template-description"
                    rows={2}
                    value={localTemplate.description ?? ''}
                    placeholder="Briefly describe the document structure..."
                    disabled={saving}
                    onChange={(e) =>
                        setLocalTemplate((prev) => ({
                            ...prev,
                            description: e.target.value
                        }))
                    }
                />
            </div>

            {/* Page Limits */}
            <div className="grid p-fluid mb-4">
                <div className="col-6 field mb-0">
                    <label
                        htmlFor="min-pages"
                        className="font-bold text-sm block mb-2"
                    >
                        Minimum Pages
                    </label>

                    <InputNumber
                        id="min-pages"
                        value={localTemplate.minPages ?? null}
                        onValueChange={(e) =>
                            setLocalTemplate((prev) => ({
                                ...prev,
                                minPages: e.value ?? undefined
                            }))
                        }
                        placeholder="Optional"
                        min={0}
                        disabled={saving}
                    />
                </div>

                <div className="col-6 field mb-0">
                    <label
                        htmlFor="max-pages"
                        className="font-bold text-sm block mb-2"
                    >
                        Maximum Pages
                    </label>

                    <InputNumber
                        id="max-pages"
                        value={localTemplate.maxPages ?? null}
                        onValueChange={(e) =>
                            setLocalTemplate((prev) => ({
                                ...prev,
                                maxPages: e.value ?? undefined
                            }))
                        }
                        placeholder="Optional"
                        min={0}
                        disabled={saving}
                    />
                </div>
            </div>

            {/* Sections Header */}
            <div className="flex align-items-center justify-content-between mb-3 border-bottom-1 surface-border pb-2">
                <span className="font-bold text-lg">
                    Expected Sections
                </span>

                <Button
                    type="button"
                    label="Add Section"
                    icon="pi pi-plus"
                    size="small"
                    severity="secondary"
                    outlined
                    onClick={addSection}
                    disabled={saving}
                />
            </div>

            {!localTemplate.sections?.length && (
                <div className="text-center p-4 surface-100 border-round text-500 mb-3">
                    No sections defined. Add sections to specify expected
                    document headers.
                </div>
            )}

            {/* Section Cards */}
            <div className="flex flex-column gap-3">
                {localTemplate.sections?.map((section, idx) => {
                    const sectionNameMissing = !section.name?.trim();

                    return (
                        <div
                            key={idx}
                            className="p-3 surface-card border-1 surface-border border-round"
                        >
                            <div className="grid p-fluid">
                                {/* Section Name */}
                                <div className="col-12 md:col-8 field mb-2">
                                    <label
                                        htmlFor={`section-name-${idx}`}
                                        className="text-xs font-bold block mb-1"
                                    >
                                        Section Header{' '}
                                        <span className="text-red-500">*</span>
                                    </label>

                                    <InputText
                                        id={`section-name-${idx}`}
                                        value={section.name ?? ''}
                                        placeholder="e.g. Methodology and Implementation"
                                        disabled={saving}
                                        onChange={(e) =>
                                            updateSection(idx, {
                                                name: e.target.value
                                            })
                                        }
                                        className={classNames({
                                            'p-invalid':
                                                submitted && sectionNameMissing
                                        })}
                                    />

                                    {submitted && sectionNameMissing && (
                                        <small className="p-error">
                                            Section name is required.
                                        </small>
                                    )}
                                </div>

                                {/* Required / Remove */}
                                <div className="col-12 md:col-4 flex align-items-center justify-content-between pt-3">
                                    <div className="flex align-items-center">
                                        <Checkbox
                                            inputId={`section-required-${idx}`}
                                            checked={!!section.required}
                                            disabled={saving}
                                            onChange={(e) =>
                                                updateSection(idx, {
                                                    required: e.checked ?? false
                                                })
                                            }
                                        />

                                        <label
                                            htmlFor={`section-required-${idx}`}
                                            className="ml-2 text-xs font-bold cursor-pointer"
                                        >
                                            Required
                                        </label>
                                    </div>

                                    <Button
                                        type="button"
                                        icon="pi pi-trash"
                                        severity="danger"
                                        text
                                        rounded
                                        disabled={saving}
                                        onClick={() => removeSection(idx)}
                                        tooltip="Remove section"
                                    />
                                </div>

                                {/* Aliases */}
                                <div className="col-12 field mb-2">
                                    <label
                                        htmlFor={`section-aliases-${idx}`}
                                        className="text-xs font-bold block mb-1"
                                    >
                                        Header Aliases / Synonyms
                                    </label>

                                    <Chips
                                        id={`section-aliases-${idx}`}
                                        value={section.aliases ?? []}
                                        disabled={saving}
                                        onChange={(e) =>
                                            updateSection(idx, {
                                                aliases: e.value ?? []
                                            })
                                        }
                                        placeholder="Enter an alias and press Enter"
                                    />
                                </div>

                                {/* Word Limits */}
                                <div className="col-6 field mb-0">
                                    <label
                                        htmlFor={`section-min-words-${idx}`}
                                        className="text-xs font-bold block mb-1"
                                    >
                                        Minimum Word Count
                                    </label>

                                    <InputNumber
                                        id={`section-min-words-${idx}`}
                                        value={section.minWords ?? null}
                                        onValueChange={(e) =>
                                            updateSection(idx, {
                                                minWords: e.value ?? undefined
                                            })
                                        }
                                        placeholder="Optional"
                                        min={0}
                                        disabled={saving}
                                    />
                                </div>

                                <div className="col-6 field mb-0">
                                    <label
                                        htmlFor={`section-max-words-${idx}`}
                                        className="text-xs font-bold block mb-1"
                                    >
                                        Maximum Word Count
                                    </label>

                                    <InputNumber
                                        id={`section-max-words-${idx}`}
                                        value={section.maxWords ?? null}
                                        onValueChange={(e) =>
                                            updateSection(idx, {
                                                maxWords: e.value ?? undefined
                                            })
                                        }
                                        placeholder="Optional"
                                        min={0}
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </form>
    );
};

export default TemplateForm;