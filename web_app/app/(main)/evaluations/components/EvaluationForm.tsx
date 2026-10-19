'use client';

import { FormEvent, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import { ItemFormRenderProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { Evaluation } from '../models/evaluation.model';
import { EvaluationStatus } from '../models/evaluation.model';

const EvaluationForm = ({ mode, item, saving, formId, onSubmit }: ItemFormRenderProps<Evaluation>) => {
    //const toast = useToast();

    // The form is only mounted while the dialog is open, so state starts fresh each time
    const [initial] = useState<Evaluation>(() => item ?? { title: "", weight: 0 });
    const [localItem, setLocalItem] = useState<Evaluation>({ ...initial });
    const [submitted, setSubmitted] = useState(false);

    // Lock logic: weight is editable only if new OR in 'draft' status
    const isWeightDisabled = Boolean(localItem._id && localItem.status !== EvaluationStatus.draft);

    const titleMissing = !localItem.title?.trim();
    const weightMissing = localItem.weight === undefined || localItem.weight === null || localItem.weight < 0;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (saving) return;

        if (titleMissing || weightMissing) {
           // toast.error('Please fix validation errors before saving.', 'Validation Error');
            return;
        }

        // ItemManager handles API creation/updates and success/error toasts
        await onSubmit({
            ...localItem,
            title: localItem.title?.trim(),
        });
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {/* Title */}
            <div className="field mb-4">
                <label htmlFor="title" className="font-bold text-sm block mb-2">
                    Title <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="title"
                    value={localItem.title || ''}
                    disabled={saving}
                    onChange={(e) => setLocalItem({ ...localItem, title: e.target.value })}
                    required
                    autoFocus
                    placeholder="Enter evaluation title"
                    className={classNames({ 'p-invalid': submitted && titleMissing })}
                />
                {submitted && titleMissing && (
                    <small className="p-error">Title is required.</small>
                )}
            </div>

            {/* Weight Field */}
            <div className="field mb-4">
                <label htmlFor="weight" className="font-bold text-sm block mb-2">
                    Total Weight (%) <span className="text-red-500">*</span>
                </label>
                <InputNumber
                    id="weight"
                    value={localItem.weight}
                    onValueChange={(e) => setLocalItem({ ...localItem, weight: e.value ?? 0 })}
                    min={0}
                    max={100}
                    disabled={saving || isWeightDisabled}
                    placeholder="e.g. 100"
                    className={classNames({ 'p-invalid': submitted && weightMissing })}
                />
                {isWeightDisabled ? (
                    <small className="text-500 italic block mt-1">Weight cannot be modified after activation.</small>
                ) : (
                    submitted && weightMissing && <small className="p-error">A valid weight is required.</small>
                )}
            </div>

            {/* Description */}
            <div className="field mb-4">
                <label htmlFor="description" className="font-bold text-sm block mb-2">
                    Description
                </label>
                <InputTextarea
                    id="description"
                    value={localItem.description ?? ''}
                    disabled={saving}
                    onChange={(e) => setLocalItem({ ...localItem, description: e.target.value })}
                    rows={4}
                    placeholder="Enter description (optional)"
                />
            </div>
        </form>
    );
};

export default EvaluationForm;