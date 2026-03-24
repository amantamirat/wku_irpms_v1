'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber"; // Added for weight
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useEffect, useRef, useState } from "react";
import { EntitySaveDialogProps } from "@/components/createEntityManager";
import { EvaluationApi } from "../api/evaluation.api";
import { Evaluation } from "../models/evaluation.model";
import { EvaluationStatus } from "../models/evaluation.state-machine";

const SaveEvaluation = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Evaluation>) => {
    const toast = useRef<Toast>(null);
    // 1. In the useState initialization
    const [localItem, setLocalItem] = useState<Evaluation>({
        ...item // This spreads existing data if editing
    });

    // 2. In the useEffect
    useEffect(() => {
        setLocalItem({
            ...item
        });
    }, [item]);
    const [submitted, setSubmitted] = useState(false);

    // Lock logic: weight is editable only if new OR in 'planned' status
    const isWeightDisabled = localItem._id && localItem.status !== EvaluationStatus.draft;

    useEffect(() => setLocalItem({ ...item }), [item]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalItem({ ...item });
    };

    const saveEvaluation = async () => {
        setSubmitted(true);
        if (!localItem.title || localItem.weight === undefined) return;

        try {
            // Note: If weight is disabled, the backend will ignore any weight change 
            // as per our previous service modification.
            let saved = localItem._id
                ? await EvaluationApi.update(localItem)
                : await EvaluationApi.create(localItem);

            toast.current?.show({
                severity: "success",
                summary: "Success",
                detail: "Evaluation saved successfully",
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 500);
        } catch (err: any) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: err.response?.data?.message || err.message || "Failed to save Evaluation",
                life: 2500,
            });
        }
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" onClick={saveEvaluation} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header={localItem._id ? "Edit Evaluation" : "New Evaluation"}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Title */}
                <div className="field">
                    <label htmlFor="title" className="font-bold">Title</label>
                    <InputText
                        id="title"
                        value={localItem.title}
                        onChange={(e) => setLocalItem({ ...localItem, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ "p-invalid": submitted && !localItem.title })}
                    />
                </div>

                {/* Weight Field */}
                <div className="field">
                    <label htmlFor="weight" className="font-bold">Total Weight (%)</label>
                    <InputNumber
                        id="weight"
                        value={localItem.weight}
                        onValueChange={(e) => setLocalItem({ ...localItem, weight: e.value ?? 0 })}
                        min={0}
                        max={100}
                        // disabled={isWeightDisabled}
                        placeholder="e.g. 100"
                        className={classNames({ "p-invalid": submitted && (localItem.weight === null || localItem.weight < 0) })}
                    />
                    {isWeightDisabled && (
                        <small className="p-error">Weight cannot be modified after activation.</small>
                    )}
                </div>

                {/* Description */}
                <div className="field">
                    <label htmlFor="description" className="font-bold">Description</label>
                    <InputTextarea
                        id="description"
                        value={localItem.description ?? ""}
                        onChange={(e) => setLocalItem({ ...localItem, description: e.target.value })}
                        rows={4}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveEvaluation;