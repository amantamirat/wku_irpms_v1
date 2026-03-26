'use client';

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useEffect, useRef, useState } from "react";
import { Thematic, ThemeLevel, validateThematic } from "../models/thematic.model";
import { useDirectorate } from "@/contexts/DirectorateContext";
import { EntitySaveDialogProps } from "@/components/createEntityManager";
import { ThematicApi } from "../api/thematic.api";

const SaveThematic = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Thematic>) => {
    const toast = useRef<Toast>(null);
    //const { directorates } = useDirectorate();

    const [localItem, setLocalItem] = useState<Thematic>({ ...item });
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

    const saveThematic = async () => {
        setSubmitted(true);
        try {
            const validation = validateThematic(localItem);
            if (!validation.valid) throw new Error(validation.message);

            let saved = localItem._id
                ? await ThematicApi.update(localItem)
                : await ThematicApi.create(localItem);

            // Re-attach relation for UI consistency if API returns flat ID
            saved = {
                ...saved,
                // directorate: localItem.directorate
            };

            toast.current?.show({
                severity: "success",
                summary: "Success",
                detail: "Thematic saved successfully",
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 500);
        } catch (err: any) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: err.message || "Failed to save Thematic",
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
            <Button label="Save" icon="pi pi-check" text onClick={saveThematic} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header={localItem._id ? "Edit Thematic" : "New Thematic"}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Directorate Selector */}
                {
                    /**
                     * <div className="field">
                    <label htmlFor="directorate">Directorate</label>
                    <Dropdown
                        id="directorate"
                        dataKey="_id"
                        value={localItem.directorate}
                        options={directorates}
                        optionLabel="name"
                        onChange={(e) => setLocalItem({ ...localItem, directorate: e.value })}
                        placeholder="Select Directorate"
                        className={classNames({ 
                            'p-invalid': submitted && !localItem.directorate 
                        })}
                    />
                </div>
                     */
                }

                {/* Title Field */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localItem.title}
                        onChange={(e) => setLocalItem({ ...localItem, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({
                            'p-invalid': submitted && !localItem.title
                        })}
                    />
                </div>

                {/* Level Field */}
                <div className="field">
                    <label htmlFor="level">Level</label>
                    <Dropdown
                        id="level"
                        value={localItem.level}
                        options={Object.values(ThemeLevel).map((val) => ({
                            label: val,
                            value: val,
                        }))}
                        onChange={(e) => setLocalItem({ ...localItem, level: e.value })}
                        placeholder="Select Depth"
                        className={classNames({
                            'p-invalid': submitted && !localItem.level,
                        })}
                        disabled={!!localItem._id}
                    />
                </div>

                {/* Description Field */}
                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        value={localItem.description ?? ''}
                        onChange={(e) => setLocalItem({ ...localItem, description: e.target.value })}
                        rows={4}
                        cols={30}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveThematic;