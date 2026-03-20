'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useEffect, useRef, useState } from "react";
import { EntitySaveDialogProps } from "@/components/createEntityManager";
import { EvaluationApi } from "../api/evaluation.api";
import { Evaluation, validateEvaluation } from "../models/evaluation.model";

const SaveEvaluation = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Evaluation>) => {

    const toast = useRef<Toast>(null);
   // const { directorates } = useDirectorate();

    const [localItem, setLocalItem] = useState<Evaluation>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    // Reset form when item changes
    useEffect(() => setLocalItem({ ...item }), [item]);

    // Clear form when dialog hides
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalItem({ ...item });
    };

    const saveEvaluation = async () => {
        setSubmitted(true);
        try {
            const validation = validateEvaluation(localItem);
            if (!validation.valid) throw new Error(validation.message);
            // Normally, API call happens outside via createEntityManager
            let saved = localItem._id
                ? await EvaluationApi.update(localItem)
                : await EvaluationApi.create(localItem);
            saved = {
                ...saved,
                // organization: localItem.organization
            };
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
                detail: err.message || "Failed to save Evaluation",
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
            <Button label="Save" icon="pi pi-check" text onClick={saveEvaluation} />
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
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localItem.title}
                        onChange={(e) =>
                            setLocalItem({ ...localItem, title: e.target.value })
                        }
                        required
                        autoFocus
                        className={classNames({
                            "p-invalid": submitted && !localItem.title
                        })}
                    />
                </div>


                {/* Description */}
                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        value={localItem.description ?? ""}
                        onChange={(e) =>
                            setLocalItem({ ...localItem, description: e.target.value })
                        }
                        rows={4}
                        cols={30}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveEvaluation;