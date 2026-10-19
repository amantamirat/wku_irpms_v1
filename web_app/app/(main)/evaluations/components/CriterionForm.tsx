'use client';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';
import { Criterion, FormType, formTypeOptions, validateCriterion, CriterionOption } from '../models/criterion.model';
import { Evaluation } from '../models/evaluation.model';
import { ItemFormRenderProps } from '@/components/ItemManager';

export interface CriterionFormProps extends ItemFormRenderProps<Criterion> {
    evaluation: Evaluation;
}

export const CriterionForm = ({
    item,
    saving,
    formId,
    onSubmit,
    evaluation
}: CriterionFormProps) => {
    const [localCriterion, setLocalCriterion] = useState<Criterion>({
        ...item,
        evaluation: evaluation?._id || evaluation,
        options: item?.options || []
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalCriterion({
            ...item,
            evaluation: evaluation?._id || evaluation,
            options: item?.options || []
        });
    }, [item, evaluation]);

    const addOption = () => {
        const newOption: CriterionOption = { _id: '', title: '', score: 0 };
        const currentOptions = localCriterion.options || [];
        setLocalCriterion({ ...localCriterion, options: [...currentOptions, newOption] });
    };

    const removeOption = (index: number) => {
        const currentOptions = localCriterion.options || [];
        const _options = currentOptions.filter((_, i) => i !== index);
        setLocalCriterion({ ...localCriterion, options: _options });
    };

    const onOptionChange = (index: number, field: keyof CriterionOption, value: any) => {
        const currentOptions = localCriterion.options || [];
        const _options = [...currentOptions];
        _options[index] = { ..._options[index], [field]: value };
        setLocalCriterion({ ...localCriterion, options: _options });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        const validation = validateCriterion(localCriterion);
        if (!validation.valid) {
            return;
        }

        onSubmit(localCriterion);
    };

    const isChoiceType = localCriterion.formType ? [FormType.SINGLE_CHOICE, FormType.MULTIPLE_CHOICE].includes(localCriterion.formType) : false;
    const optionsCount = localCriterion.options?.length || 0;

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid">
            {/* Evaluation Field */}
            <div className="field">
                <label>Evaluation</label>
                <InputText value={evaluation?.title || (evaluation as unknown as string) || ''} disabled />
            </div>

            <div className="formgrid grid">
                <div className="field col">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localCriterion.title || ''}
                        onChange={(e) => setLocalCriterion({ ...localCriterion, title: e.target.value })}
                        required
                        disabled={saving}
                        className={classNames({ 'p-invalid': submitted && !localCriterion.title })}
                    />
                </div>
                <div className="field col-3">
                    <label htmlFor="weight">Weight</label>
                    <InputNumber
                        id="weight"
                        value={localCriterion.weight}
                        onValueChange={(e) => setLocalCriterion({ ...localCriterion, weight: e.value ?? 0 })}
                        min={0}
                        max={100}
                        disabled={saving || localCriterion.formType === FormType.OPEN}
                    />
                </div>
            </div>

            <div className="field">
                <label htmlFor="formType">Form Type</label>
                <Dropdown
                    id="formType"
                    value={localCriterion.formType}
                    options={formTypeOptions}
                    onChange={(e) => {
                        const selectedType = e.value;
                        setLocalCriterion({
                            ...localCriterion,
                            formType: selectedType,
                            weight: selectedType === FormType.OPEN ? 0 : localCriterion.weight
                        });
                    }}
                    placeholder="Select Form Type"
                    disabled={saving}
                />
            </div>

            {/* Dynamic Options Section with Reordering */}
            {isChoiceType && (
                <div className="field border-top-1 surface-border pt-3">
                    <div className="flex justify-content-between align-items-center mb-2">
                        <span className="text-900 font-bold">Options & Scoring</span>
                        <Button
                            type="button"
                            icon="pi pi-plus"
                            label="Add Option"
                            className="p-button-sm p-button-outlined"
                            onClick={addOption}
                            disabled={saving}
                        />
                    </div>

                    <DataTable
                        value={localCriterion.options || []}
                        reorderableRows={!saving}
                        onRowReorder={(e) => setLocalCriterion({ ...localCriterion, options: e.value })}
                        responsiveLayout="scroll"
                        emptyMessage="No options added yet."
                    >
                        <Column rowReorder style={{ width: '3rem' }} />

                        <Column
                            header="Option Text"
                            body={(_, { rowIndex }) => {
                                const currentOptions = localCriterion.options || [];
                                return (
                                    <InputText
                                        value={currentOptions[rowIndex]?.title || ''}
                                        onChange={(e) => onOptionChange(rowIndex, 'title', e.target.value)}
                                        placeholder="e.g. Excellent"
                                        disabled={saving}
                                        className={classNames({
                                            'p-invalid': submitted && !currentOptions[rowIndex]?.title
                                        })}
                                    />
                                );
                            }}
                        />

                        <Column
                            header="Score"
                            style={{ width: '100px' }}
                            body={(_, { rowIndex }) => {
                                const currentOptions = localCriterion.options || [];
                                return (
                                    <InputNumber
                                        value={currentOptions[rowIndex]?.score ?? 0}
                                        onValueChange={(e) => onOptionChange(rowIndex, 'score', e.value)}
                                        min={0}
                                        max={localCriterion.weight}
                                        disabled={saving}
                                    />
                                );
                            }}
                        />

                        <Column
                            style={{ width: '50px' }}
                            body={(_, { rowIndex }) => (
                                <Button
                                    type="button"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    text
                                    disabled={saving}
                                    onClick={() => removeOption(rowIndex)}
                                />
                            )}
                        />
                    </DataTable>
                    {submitted && optionsCount === 0 && (
                        <small className="p-error">At least one option is required for choice-based criteria.</small>
                    )}
                </div>
            )}
        </form>
    );
};

export default CriterionForm;