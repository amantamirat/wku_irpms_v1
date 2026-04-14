import { Criterion, FormType, CriterionOption } from '@/app/(main)/evaluations/models/criterion.model';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { SelectButton } from 'primereact/selectbutton';
import { Tag } from 'primereact/tag';
import { Checkbox } from 'primereact/checkbox';
import { Result } from '../../models/result.model';

interface CriterionCardProps {
    criterion: Criterion;
    result: Partial<Result>;
    onUpdate: (updates: Partial<Result>) => void;
}

export const CriterionCard = ({ criterion, result, onUpdate }: CriterionCardProps) => {

    const getIds = () =>
        (result.selectedOptions || []).map(o =>
            typeof o === 'string' ? o : o._id
        );

    /* --------------------------------
       MULTI TOGGLE
    --------------------------------- */
    const toggleMulti = (opt: CriterionOption) => {
        const current = getIds();
        const exists = current.includes(opt._id);

        const updated = exists
            ? current.filter(id => id !== opt._id)
            : [...current, opt._id];

        onUpdate({ selectedOptions: updated });
    };

    /* --------------------------------
       MULTI SCORE
    --------------------------------- */
    const multiScore = () => {
        if (!criterion.options) return 0;

        return criterion.options
            .filter(opt => getIds().includes(opt._id))
            .reduce((sum, opt) => sum + opt.score, 0);
    };

    return (
        <div className="surface-card p-4 border-round-xl shadow-1 mb-4 border-left-3 border-primary">

            {/* Header */}
            <div className="flex justify-content-between mb-3">
                <h3 className="text-xl font-semibold m-0">{criterion.title}</h3>
                <Tag value={`Weight: ${criterion.weight}`} severity="info" />
            </div>

            {/* ---------------- FORM BODY ---------------- */}
            <div className="py-3">

                {/* -------- SINGLE -------- */}
                {criterion.formType === FormType.SINGLE_CHOICE && (
                    <SelectButton
                        value={getIds()[0]}
                        options={criterion.options}
                        optionLabel="title"
                        optionValue="_id"
                        onChange={(e) =>
                            onUpdate({
                                selectedOptions: e.value ? [e.value] : []
                            })
                        }
                        itemTemplate={(opt) => (
                            <div className="text-center px-2">
                                <div>{opt.title}</div>
                                <small className="text-600">
                                    ({opt.score})
                                </small>
                            </div>
                        )}
                    />
                )}

                {/* -------- MULTIPLE -------- */}
                {criterion.formType === FormType.MULTIPLE_CHOICE && (
                    <div className="flex flex-column gap-2">
                        {criterion.options.map((opt) => {
                            const selected = getIds().includes(opt._id);

                            return (
                                <div
                                    key={opt._id}
                                    className={`flex justify-content-between align-items-center p-2 border-round border-1 cursor-pointer
                                        ${selected ? 'bg-primary-50 border-primary' : 'hover:surface-100'}`}
                                    onClick={() => toggleMulti(opt)}
                                >
                                    <div className="flex align-items-center gap-2">
                                        <Checkbox
                                            checked={selected}
                                            onChange={() => toggleMulti(opt)}
                                        />
                                        <span>{opt.title}</span>
                                    </div>

                                    <span className="text-600 font-medium">
                                        ({opt.score})
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* -------- NUMBER -------- */}
                {criterion.formType === FormType.NUMBER && (
                    <div className="flex align-items-center gap-3">
                        <label className="font-medium">Score:</label>
                        <InputNumber
                            value={result.score}
                            max={criterion.weight}
                            min={0}
                            onValueChange={(e) =>
                                onUpdate({ score: e.value ?? 0 })
                            }
                            showButtons
                            buttonLayout="horizontal"
                            decrementButtonClassName="p-button-secondary"
                            incrementButtonClassName="p-button-secondary"
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus"
                        />
                    </div>
                )}

                {/* -------- OPEN -------- */}
                {criterion.formType === FormType.OPEN && (
                    <div className="flex flex-column gap-2">
                        <label className="font-medium">Your Response</label>
                        <InputTextarea
                            value={result.comment || ""}
                            onChange={(e) =>
                                onUpdate({ comment: e.target.value })
                            }
                            rows={4}
                            className="w-full"
                            placeholder="Write your evaluation..."
                        />
                    </div>
                )}
            </div>

            {/* -------- SCORE DISPLAY -------- */}
            {criterion.formType !== FormType.OPEN && (
                <div className="mt-3 text-right text-sm text-primary font-medium">
                    Score: {
                        criterion.formType === FormType.NUMBER
                            ? (result.score ?? 0)
                            : multiScore()
                    } / {criterion.weight}
                </div>
            )}

            {/* -------- OPTIONAL COMMENT (NON-OPEN) -------- */}
            {criterion.formType !== FormType.OPEN && (
                <div className="mt-3">
                    <span className="p-float-label">
                        <InputTextarea
                            id={`comment-${criterion._id}`}
                            value={result.comment || ""}
                            onChange={(e) =>
                                onUpdate({ comment: e.target.value })
                            }
                            rows={2}
                            className="w-full"
                        />
                        <label htmlFor={`comment-${criterion._id}`}>
                            Optional Feedback
                        </label>
                    </span>
                </div>
            )}
        </div>
    );
};