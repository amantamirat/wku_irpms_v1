import { Criterion, FormType } from '@/app/(main)/evaluations/models/criterion.model';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { Result } from '../../models/result.model';


interface CriterionCardProps {
    criterion: Criterion;
    result: Partial<Result>;
    onUpdate: (updates: Partial<Result>) => void;
}

export const CriterionCard = ({ criterion, result, onUpdate }: CriterionCardProps) => {
    
    const getIds = () => (result.selectedOptions || []).map(o => typeof o === 'string' ? o : o._id);

    return (
        <div className="surface-card p-4 border-round-xl shadow-1 mb-4 border-left-3 border-primary">
            <div className="flex justify-content-between mb-3">
                <h3 className="text-xl font-semibold m-0">{criterion.title}</h3>
                <Tag value={`Weight: ${criterion.weight}`} severity="info" />
            </div>

            {/* Render logic based on FormType */}
            <div className="py-3">
                {criterion.formType === FormType.SINGLE_CHOICE && (
                    <SelectButton
                        value={getIds()[0]}
                        options={criterion.options}
                        optionLabel="title"
                        optionValue="_id"
                        onChange={(e) => onUpdate({ selectedOptions: e.value ? [e.value] : [] })}
                        itemTemplate={(opt) => (
                            <div className="text-center">
                                <div>{opt.title}</div>
                                <small className="text-600">{opt.score} pts</small>
                            </div>
                        )}
                    />
                )}

                {criterion.formType === FormType.NUMBER && (
                    <div className="flex align-items-center gap-3">
                        <label className="font-medium">Score:</label>
                        <InputNumber 
                            value={result.score} 
                            max={criterion.weight} 
                            min={0}
                            onValueChange={(e) => onUpdate({ score: e.value ?? 0 })}
                            showButtons 
                            buttonLayout="horizontal"
                            decrementButtonClassName="p-button-secondary"
                            incrementButtonClassName="p-button-secondary"
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus"
                        />
                    </div>
                )}
                
                {/* Add Multiple Choice and Open Form logic here similarly */}
            </div>

            <div className="mt-3">
                <span className="p-float-label">
                    <InputTextarea 
                        id="comment" 
                        value={result.comment || ""} 
                        onChange={(e) => onUpdate({ comment: e.target.value })}
                        rows={2} 
                        className="w-full"
                    />
                    <label htmlFor="comment">Optional Feedback</label>
                </span>
            </div>
        </div>
    );
};