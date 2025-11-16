//import { Evaluation, evaluationTemplate, FormType } from "@/app/(main)/evals/models/evaluation.model";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { ResultApi } from "../api/result.api";
import { Result, validateResult } from "../models/result.model";
import { Dropdown } from "primereact/dropdown";
import { Option } from "@/app/(main)/evaluations/models/option.model";
import { Criterion, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import { OptionApi } from "@/app/(main)/evaluations/api/option.api";
import { InputTextarea } from "primereact/inputtextarea";

interface SaveResultDialogProps {
    result: Result;
    visible: boolean;
    onCompelete?: (savedResult: Result) => void;
    onHide: () => void;
}

const SaveResultDialog = ({ visible, result, onCompelete, onHide }: SaveResultDialogProps) => {

    const toast = useRef<Toast>(null);
    const [submitting, setSubmitting] = useState(false);
    const [options, setOptions] = useState<Option[]>([]);
    const [localResult, setLocalResult] = useState<Result>(result);
    const criterion = result.criterion as Criterion;

    useEffect(() => {
        setLocalResult(result || {});
    }, [result]);

    useEffect(() => {
        if ((result.criterion as Criterion).form_type === FormType.closed) {
            const fetchOptions = async () => {
                try {
                    const data = await OptionApi.getOptions({ criterion: criterion._id });
                    setOptions(data);
                } catch (err) {
                    console.error("Failed to fetch options:", err);
                }
            };
            fetchOptions();
        }
    }, [criterion.form_type]);


    const saveResult = async () => {
        try {
            setSubmitting(true);
            const validation = validateResult(localResult);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved: Result;
            if (localResult._id) {
                saved = await ResultApi.updateResult(localResult);
            } else {
                saved = await ResultApi.createResult(localResult);
            }
            saved = {
                ...saved,
                reviewer: localResult.reviewer,
                criterion: localResult.criterion,
                selected_option: localResult.selected_option
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Result Saved.`,
                life: 2000
            });
            if (onCompelete) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                onCompelete(saved);
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to Save Result',
                detail: '' + err,
                life: 2000
            });
        } finally {
            setSubmitting(false);
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" loading={submitting} disabled={submitting} icon="pi pi-check" text onClick={saveResult} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "500px" }}
                header="Result Details"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <h3 className="mb-3 text-center text-xl font-semibold break-words">
                    {criterion.title}
                </h3>
                {
                    (result.criterion && criterion.form_type === FormType.closed) &&
                    <div className="field">
                        <label htmlFor="selected_option">Score</label>
                        <Dropdown
                            id="selected_option"
                            dataKey="_id"
                            value={localResult.selected_option}
                            options={options}
                            onChange={(e) => {
                                setLocalResult({ ...localResult, selected_option: e.value });
                            }}
                            optionLabel="title"
                            placeholder="Select Option"
                        />
                    </div>

                }
                {
                    (result.criterion && criterion.form_type === FormType.open) &&
                    <div className="field">
                        <label htmlFor="score">Score</label>
                        <InputNumber
                            id="score"
                            value={localResult.score}
                            onValueChange={(e) => setLocalResult({ ...localResult, score: e.value ?? 0 })}
                            min={0}
                            max={criterion.weight}
                            placeholder="Enter score"
                        />
                    </div>
                }
                {/* Comment Field */}
                <div className="field">
                    <label htmlFor="comment">Comment</label>
                    <InputTextarea
                        id="comment"
                        value={localResult.comment ?? ''}
                        onChange={(e) => setLocalResult({ ...localResult, comment: e.target.value })}
                        rows={4}
                        cols={30}
                        maxLength={2000}
                    />
                </div>

            </Dialog>
        </>
    );
}

export default SaveResultDialog;