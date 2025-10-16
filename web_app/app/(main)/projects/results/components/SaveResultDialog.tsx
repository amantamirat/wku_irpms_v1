import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { ResultApi } from "../api/result.api";
import { Result, validateResult } from "../models/result.model";
import { EvalType, Evaluation } from "@/app/(main)/evals/models/eval.model";
import { EvaluationApi } from "@/app/(main)/evals/api/eval.api";
import { Dropdown } from "primereact/dropdown";

interface SaveResultDialogProps {
    visible: boolean;
    result: Result;
    onCompelete?: (savedResult: Result) => void;
    onHide: () => void;
}

const SaveResultDialog = ({ visible, result, onCompelete, onHide }: SaveResultDialogProps) => {

    const toast = useRef<Toast>(null);
    const [criteria, setCriteria] = useState<Evaluation[]>([]);
    const [localResult, setLocalResult] = useState(result || {});

    useEffect(() => {
        setLocalResult(result || {});
    }, [result]);


    useEffect(() => {
        const fetchCriteria = async () => {
            try {
                const data = await EvaluationApi.getEvaluations({ type: EvalType.criterion });
                setCriteria(data);
            } catch (err) {
                // Optionally handle error
            }
        };
        fetchCriteria();
    }, []);

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
                criterion: localResult.criterion
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
                <div className="field">
                    <label htmlFor="criterion">Criterion</label>
                    <Dropdown
                        id="criterion"
                        dataKey="_id"
                        value={localResult.criterion}
                        options={criteria}
                        onChange={(e) =>
                            setLocalResult({ ...localResult, criterion: e.value })
                        }
                        optionLabel="title"
                        placeholder="Select Criterion"
                    />
                </div>
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
                <div className="field">
                    <label htmlFor="comment">Comment</label>
                    <InputTextarea
                        id="comment"
                        rows={3}
                        value={localResult.comment}
                        onChange={(e) => setLocalResult({ ...localResult, comment: e.target.value })}
                        autoResize
                        placeholder="Enter comment (optional)"
                    />
                </div>

            </Dialog>
        </>
    );
}

export default SaveResultDialog;