import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Result, validateResult } from "../models/result.model";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Criterion, CriterionOption, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import { InputTextarea } from "primereact/inputtextarea";
import { ResultApi } from "../api/result.api";
import { EntitySaveDialogProps } from "@/components/createEntityManager";

const SaveResult = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<Result>) => {

    const toast = useRef<Toast>(null);
    const [submitting, setSubmitting] = useState(false);
    const [localResult, setLocalResult] = useState<Result | null>(null);

    /* --------------------------------
       Sync result → localResult
    --------------------------------- */
    useEffect(() => {
        if (!item) {
            setLocalResult(null);
            return;
        }

        setLocalResult({
            _id: item._id,
            criterion: item.criterion,
            reviewer: item.reviewer,
            score: item.score,
            selectedOptions: item.selectedOptions ?? [],
            comment: item.comment ?? ""
        });
    }, [item]);

    /* --------------------------------
       Save
    --------------------------------- */
    const saveResult = async () => {
        if (!localResult?._id) return;

        try {
            setSubmitting(true);

            const validation = validateResult(
                localResult,
                localResult.criterion as Criterion
            );

            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const saved = await ResultApi.update(localResult);

            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Result Saved.",
                life: 2000
            });

            onComplete?.(saved);
            onHide();
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Failed to Save Result",
                detail: String(err),
                life: 2000
            });
        } finally {
            setSubmitting(false);
        }
    };

    const criterion = localResult?.criterion as Criterion | undefined;

    /* --------------------------------
       Helpers
    --------------------------------- */
    const getSelectedIds = () =>
        (localResult?.selectedOptions || []).map((opt: any) =>
            typeof opt === "object" ? opt._id : opt
        );

    const toggleMultiOption = (option: CriterionOption) => {
        if (!localResult) return;

        const current = getSelectedIds();

        const exists = current.includes(option._id);
        const updated = exists
            ? current.filter((id) => id !== option._id)
            : [...current, option._id];

        setLocalResult({
            ...localResult,
            selectedOptions: updated
        });
    };

    const optionTemplate = (option: CriterionOption) => {
        return (
            <div className="flex justify-content-between w-full">
                <span>{option.title}</span>
                <span className="text-600">({option.score})</span>
            </div>
        );
    };

    const selectedValueTemplate = (option: CriterionOption | null) => {
        if (!option) return <span className="text-400">Select Option</span>;

        return (
            <span>
                {option.title} <span className="text-600">({option.score})</span>
            </span>
        );
    };

    const totalSelectedScore = () => {
        if (!criterion || !localResult?.selectedOptions) return 0;

        return criterion.options
            .filter(opt => getSelectedIds().includes(opt._id))
            .reduce((sum, opt) => sum + opt.score, 0);
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "500px" }}
                header="Result Details"
                modal
                className="p-fluid"
                footer={
                    <>
                        <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
                        <Button
                            label="Save"
                            icon="pi pi-check"
                            text
                            loading={submitting}
                            disabled={!localResult || submitting}
                            onClick={saveResult}
                        />
                    </>
                }
                onHide={onHide}
            >
                {!localResult || !criterion ? (
                    <p className="text-center text-gray-400">Loading...</p>
                ) : (
                    <>
                        <h3 className="mb-3 text-center text-xl font-semibold">
                            {criterion.title}
                        </h3>

                        {/* ---------------- NUMBER ---------------- */}
                        {criterion.formType === FormType.NUMBER && (
                            <div className="field">
                                <label>Score</label>
                                <InputNumber
                                    value={localResult.score}
                                    min={0}
                                    max={criterion.weight}
                                    onValueChange={(e) =>
                                        setLocalResult({
                                            ...localResult,
                                            score: e.value ?? 0
                                        })
                                    }
                                />
                            </div>
                        )}

                        {/* ---------------- SINGLE ---------------- */}
                        {criterion.formType === FormType.SINGLE_CHOICE && (
                            <div className="field">
                                <label>Select Option</label>
                                <Dropdown
                                    value={getSelectedIds()[0] || null}
                                    options={criterion.options}
                                    optionLabel="title"
                                    optionValue="_id"
                                    placeholder="Select Option"
                                    itemTemplate={optionTemplate}
                                    valueTemplate={selectedValueTemplate}
                                    onChange={(e) =>
                                        setLocalResult({
                                            ...localResult,
                                            selectedOptions: [e.value]
                                        })
                                    }
                                />
                            </div>
                        )}

                        {/* ---------------- MULTIPLE ---------------- */}
                        {criterion.formType === FormType.MULTIPLE_CHOICE && (
                            <div className="field">
                                <label>Select Options</label>
                                <div className="flex flex-column gap-2">
                                    {criterion.options.map((opt) => (
                                        <div key={opt._id} className="flex align-items-center justify-content-between">
                                            <div className="flex align-items-center">
                                                <Checkbox
                                                    inputId={opt._id}
                                                    checked={getSelectedIds().includes(opt._id)}
                                                    onChange={() => toggleMultiOption(opt)}
                                                />
                                                <label htmlFor={opt._id} className="ml-2">
                                                    {opt.title}
                                                </label>
                                            </div>

                                            {/* ✅ score display */}
                                            <span className="text-600">({opt.score})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-right text-sm text-600 mt-2">
                            Total: {totalSelectedScore()} / {criterion.weight}
                        </div>

                        {/* ---------------- OPEN ---------------- */}
                        {criterion.formType === FormType.OPEN && (
                            <div className="field">
                                <label>Comment</label>
                                <InputTextarea
                                    rows={4}
                                    value={localResult.comment}
                                    onChange={(e) =>
                                        setLocalResult({
                                            ...localResult,
                                            comment: e.target.value
                                        })
                                    }
                                />
                            </div>
                        )}

                        {/* Optional Comment for all non-open */}
                        {criterion.formType !== FormType.OPEN && (
                            <div className="field">
                                <label>Comment (optional)</label>
                                <InputTextarea
                                    rows={3}
                                    value={localResult.comment}
                                    onChange={(e) =>
                                        setLocalResult({
                                            ...localResult,
                                            comment: e.target.value
                                        })
                                    }
                                />
                            </div>
                        )}
                    </>
                )}
            </Dialog>
        </>
    );
};

export default SaveResult;