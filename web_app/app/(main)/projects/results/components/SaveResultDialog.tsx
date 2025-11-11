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

interface SaveResultDialogProps {
    visible: boolean;
    result: Result;
    onCompelete?: (savedResult: Result) => void;
    criterion: Criterion;
    onHide: () => void;
}

const SaveResultDialog = ({ visible, result, onCompelete, onHide, criterion }: SaveResultDialogProps) => {

    const toast = useRef<Toast>(null);
    const [options, setOptions] = useState<Option[]>([]);
    const [localResult, setLocalResult] = useState(result || {});

    useEffect(() => {
        setLocalResult(result || {});
    }, [result]);

    useEffect(() => {
        if ((result.criterion as Criterion).form_type === FormType.closed) {
            const fetchOptions = async () => {
                try {
                    const data = await OptionApi.getOptions({ criterion: criterion._id });
                    //console.log(data);
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
                <h3 className="mb-3 text-center">{criterion.title}</h3>
                {
                    (result.criterion && criterion.form_type === FormType.closed) &&
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
                            optionValue="_id" 
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
                            placeholder="Enter score"
                        />
                    </div>
                }

            </Dialog>
        </>
    );
}

export default SaveResultDialog;