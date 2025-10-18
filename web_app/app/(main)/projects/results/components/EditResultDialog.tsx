import { Evaluation, FormType } from "@/app/(main)/evals/models/eval.model";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { ResultApi } from "../api/result.api";
import { Result, validateResult } from "../models/result.model";
import { EvaluationApi } from "@/app/(main)/evals/api/evaluation.api";
import { Dropdown } from "primereact/dropdown";

interface EditResultDialogProps {
    visible: boolean;
    result: Result;
    onCompelete?: (savedResult: Result) => void;
    onHide: () => void;
}

const EditResultDialog = ({ visible, result, onCompelete, onHide }: EditResultDialogProps) => {

    const toast = useRef<Toast>(null);
    const [options, setOptions] = useState<Evaluation[]>([]);
    const [localResult, setLocalResult] = useState(result || {});

    useEffect(() => {
        setLocalResult(result || {});
    }, [result]);

    useEffect(() => {
        if (result.criterion && (result.criterion as Evaluation).form_type === FormType.closed) {
            const fetchOptions = async () => {
                try {
                    const data = await EvaluationApi.getEvaluations({ parent: (result.criterion as Evaluation)._id });
                    setOptions(data);
                } catch (err) {
                    console.error("Failed to fetch options:", err);
                }
            };
            fetchOptions();
        }
    }, [result]);


    const saveResult = async () => {
        try {
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
                evaluator: localResult.evaluator,
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
                setTimeout(() => onCompelete(saved), 2000);
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to Save Result',
                detail: '' + err,
                life: 2000
            });
        } finally {
            // Any cleanup if necessary
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveResult} />
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
                <h3 className="mb-3 text-center">{(result.criterion as Evaluation).title}</h3>
                {
                    (result.criterion && (result.criterion as Evaluation).form_type === FormType.closed) &&
                    <div className="field">
                        <label htmlFor="option">Option</label>
                        <Dropdown
                            id="option"
                            dataKey="_id"
                            value={localResult.selected_option}
                            options={options}
                            onChange={(e) =>
                                setLocalResult({ ...localResult, selected_option: e.value })
                            }
                            optionLabel="title"
                            placeholder="Select Option"
                        />
                    </div>
                }
                {
                    (result.criterion && (result.criterion as Evaluation).form_type === FormType.open) &&
                    <div className="field">
                        <label htmlFor="score">Score</label>
                        <InputNumber
                            id="score"
                            value={localResult.score}
                            onValueChange={(e) => setLocalResult({ ...localResult, score: e.value ?? 0 })}
                            min={0}
                            placeholder="Enter score"
                        />
                    </div>
                }

            </Dialog>
        </>
    );
}

export default EditResultDialog;