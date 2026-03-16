import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { Result, validateResult } from "../models/result.model";
import { Dropdown } from "primereact/dropdown";
import { Option } from "@/app/(main)/evaluations/models/option.model";
import { Criterion, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import { OptionApi } from "@/app/(main)/evaluations/api/option.api";
import { InputTextarea } from "primereact/inputtextarea";
import { ResultApi } from "../api/result.api";

interface SaveResultDialogProps {
    result?: Result; // ✅ OPTIONAL
    visible: boolean;
    onCompelete?: (saved: Result) => void;
    onHide: () => void;
}

const SaveResultDialog = ({
    visible,
    result,
    onCompelete,
    onHide
}: SaveResultDialogProps) => {

    const toast = useRef<Toast>(null);
    const [submitting, setSubmitting] = useState(false);
    const [options, setOptions] = useState<Option[]>([]);
    const [localResult, setLocalResult] = useState<Result | null>(null);

    /* --------------------------------
       Sync result → localResult
    --------------------------------- */
    useEffect(() => {
        if (!result) {
            setLocalResult(null);
            return;
        }

        setLocalResult({
            _id: result._id,
            criterion: result.criterion,
            reviewer: result.reviewer,
            score: result.score ?? 0,
            selectedOption: result.selectedOption,
            comment: result.comment ?? ""
        });
    }, [result]);

    /* --------------------------------
       Fetch options (guarded)
    --------------------------------- */
    useEffect(() => {
        if (!localResult) return;

        const criterion = localResult.criterion as Criterion;
        if (criterion.formType !== FormType.closed) return;

        const fetchOptions = async () => {
            try {
                const data = await OptionApi.getAll({ criterion: criterion._id });
                setOptions(data);
            } catch (err) {
                console.error("Failed to fetch options:", err);
            }
        };

        fetchOptions();
    }, [localResult]);

    /* --------------------------------
       Save
    --------------------------------- */
    const saveResult = async () => {
        if (!localResult?._id) return;

        try {
            setSubmitting(true);

            const validation = validateResult(localResult);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            /*
            const saved = localResult._id
                ? await ResultApi.updateResult(localResult)
                : await ResultApi.createResult(localResult);
            */
            const saved = await ResultApi.updateResult(localResult);
            
            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Result Saved.",
                life: 2000
            });

            onCompelete?.({
                ...saved, criterion: localResult.criterion,
                selectedOption: localResult.selectedOption
            });
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

                        {criterion.formType === FormType.closed && (
                            <div className="field">
                                <label>Score</label>
                                <Dropdown
                                    value={localResult.selectedOption}
                                    dataKey="_id"
                                    options={options}
                                    optionLabel="title"
                                    placeholder="Select Option"
                                    onChange={(e) =>
                                        setLocalResult({
                                            ...localResult,
                                            selectedOption: e.value
                                        })
                                    }
                                />
                            </div>
                        )}

                        {criterion.formType === FormType.open && (
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
                    </>
                )}
            </Dialog>
        </>
    );
};

export default SaveResultDialog;
