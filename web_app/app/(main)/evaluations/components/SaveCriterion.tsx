'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { CriterionApi } from '../api/criterion.api';
import { EvaluationApi } from '../../evaluations/api/evaluation.api';
import { Criterion, FormType, formTypeOptions, validateCriterion, CriterionOption } from '../models/criterion.model';
import { Evaluation } from '../../evaluations/models/evaluation.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveCriterion = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Criterion>) => {
    const toast = useRef<Toast>(null);
    const [localCriterion, setLocalCriterion] = useState<Criterion>({ ...item, options: item.options || [] });
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const isEvaluationPredefined = !!item.evaluation && (typeof item.evaluation === 'object' ? !!item.evaluation._id : true);

    useEffect(() => {
        setLocalCriterion({ ...item, options: item.options || [] });
    }, [item]);

    useEffect(() => {
        if (visible && !isEvaluationPredefined) {
            EvaluationApi.getAll()
                .then(setEvaluations)
                .catch(err => console.error('Failed to fetch evaluations:', err));
        }
    }, [visible, isEvaluationPredefined]);

    const addOption = () => {
        const newOption: CriterionOption = { _id: '', title: '', score: 0 };
        setLocalCriterion({ ...localCriterion, options: [...localCriterion.options, newOption] });
    };

    const removeOption = (index: number) => {
        const _options = localCriterion.options.filter((_, i) => i !== index);
        setLocalCriterion({ ...localCriterion, options: _options });
    };

    const onOptionChange = (index: number, field: keyof CriterionOption, value: any) => {
        const _options = [...localCriterion.options];
        _options[index] = { ..._options[index], [field]: value };
        setLocalCriterion({ ...localCriterion, options: _options });
    };

    const saveCriterion = async () => {
        setSubmitted(true);
        const validation = validateCriterion(localCriterion);
        if (!validation.valid) {
            toast.current?.show({ severity: 'error', summary: 'Validation', detail: validation.message });
            return;
        }

        try {
            const saved = localCriterion._id
                ? await CriterionApi.update(localCriterion)
                : await CriterionApi.create(localCriterion);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Criterion saved successfully' });
            if (onComplete) onComplete(saved);
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" onClick={saveCriterion} />
        </>
    );

    const isChoiceType = [FormType.SINGLE_CHOICE, FormType.MULTIPLE_CHOICE].includes(localCriterion.formType);

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                header={localCriterion._id ? 'Edit Criterion' : 'New Criterion'}
                modal className="p-fluid" style={{ width: '700px' }}
                footer={footer} onHide={onHide}
                maximizable
            >
                {/* Evaluation Selector */}
                <div className="field">
                    <label>Evaluation</label>
                    {isEvaluationPredefined ? (
                        <InputText value={(localCriterion.evaluation as Evaluation)?.title || (localCriterion.evaluation as string)} disabled />
                    ) : (
                        <Dropdown
                            value={localCriterion.evaluation}
                            options={evaluations}
                            optionLabel="title"
                            dataKey="_id"
                            onChange={(e) => setLocalCriterion({ ...localCriterion, evaluation: e.value })}
                            placeholder="Select Evaluation"
                            className={classNames({ 'p-invalid': submitted && !localCriterion.evaluation })}
                        />
                    )}
                </div>

                <div className="formgrid grid">
                    <div className="field col">
                        <label htmlFor="title">Title</label>
                        <InputText id="title" value={localCriterion.title} onChange={(e) => setLocalCriterion({ ...localCriterion, title: e.target.value })} required className={classNames({ 'p-invalid': submitted && !localCriterion.title })} />
                    </div>
                    <div className="field col-3">
                        <label htmlFor="weight">Weight</label>
                        <InputNumber id="weight" value={localCriterion.weight}
                            onValueChange=
                            {(e) => setLocalCriterion({ ...localCriterion, weight: e.value ?? 0 })}
                            min={0} max={100}
                            disabled={localCriterion.formType === FormType.OPEN}
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
                            />
                        </div>

                        <DataTable
                            value={localCriterion.options}
                            reorderableRows
                            onRowReorder={(e) => setLocalCriterion({ ...localCriterion, options: e.value })}
                            responsiveLayout="scroll"
                            emptyMessage="No options added yet."
                        >
                            {/* Handle for Drag and Drop */}
                            <Column rowReorder style={{ width: '3rem' }} />

                            <Column header="Option Text" body={(_, { rowIndex }) => (
                                <InputText
                                    value={localCriterion.options[rowIndex].title}
                                    onChange={(e) => onOptionChange(rowIndex, 'title', e.target.value)}
                                    placeholder="e.g. Excellent"
                                    className={classNames({ 'p-invalid': submitted && !localCriterion.options[rowIndex].title })}
                                />
                            )} />

                            <Column header="Score" style={{ width: '100px' }} body={(_, { rowIndex }) => (
                                <InputNumber
                                    value={localCriterion.options[rowIndex].score}
                                    onValueChange={(e) => onOptionChange(rowIndex, 'score', e.value)}
                                    min={0}
                                    max={localCriterion.weight}
                                />
                            )} />

                            <Column style={{ width: '50px' }} body={(_, { rowIndex }) => (
                                <Button
                                    type="button"
                                    icon="pi pi-trash"
                                    severity="danger"
                                    text
                                    onClick={() => removeOption(rowIndex)}
                                />
                            )} />
                        </DataTable>
                        {submitted && localCriterion.options.length === 0 && (
                            <small className="p-error">At least one option is required for choice-based criteria.</small>
                        )}
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SaveCriterion;