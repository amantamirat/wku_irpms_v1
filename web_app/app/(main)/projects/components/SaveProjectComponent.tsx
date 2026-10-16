'use client';

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { CollaboratorApi } from "@/app/(main)/collaborators/api/collaborator.api";
import type { Collaborator } from "@/app/(main)/collaborators/models/collaborator.model";
import { EntitySaveDialogProps } from "@/components/createEntityManager";
import { extractId } from "@/utils/utils";
import { ProjectComponentApi } from "../phases/api/phase-component.api";
import type { ProjectComponent } from "../phases/models/phase-component.model";

const SaveProjectComponent = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<ProjectComponent>) => {
    const [component, setComponent] = useState<ProjectComponent>({
        ...item,
        contributors: item.contributors || []
    });
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);
    const toast = useRef<Toast>(null);
    const projectId = extractId(component.project);

    useEffect(() => {
        setComponent({ ...item, contributors: item.contributors || [] });
        setSubmitted(false);
    }, [item]);

    useEffect(() => {
        if (!visible || !projectId) return;
        CollaboratorApi.lookup!({ project: projectId })
            .then(setCollaborators)
            .catch(error => {
                console.error("Failed to load project collaborators:", error);
                setCollaborators([]);
            });
    }, [visible, projectId]);

    const contributorOptions = collaborators
        .filter(collaborator => !collaborator.isLeadPI)
        .map(collaborator => {
            const member = typeof collaborator.member === "object"
                ? collaborator.member
                : undefined;
            const id = extractId(collaborator.member);
            return id ? {
                label: member?.name || id,
                value: id
            } : null;
        })
        .filter((option): option is { label: string; value: string } => !!option);

    const handleSave = async () => {
        setSubmitted(true);
        if (!component.title?.trim() || !component.contributors?.length || !projectId) return;

        setSaving(true);
        try {
            const payload: ProjectComponent = {
                ...component,
                project: projectId,
                title: component.title.trim(),
                contributors: component.contributors.map(extractId).filter((id): id is string => !!id)
            };
            const saved = component._id
                ? await ProjectComponentApi.update(payload)
                : await ProjectComponentApi.create(payload);
            onComplete(saved);
        } catch (error: any) {
            toast.current?.show({
                severity: "error",
                summary: "Save failed",
                detail: error.message || String(error),
                life: 3500
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                modal
                header={component._id ? "Edit Project Component" : "New Project Component"}
                style={{ width: "38rem", maxWidth: "95vw" }}
                onHide={onHide}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
                        <Button
                            label="Save Component"
                            icon="pi pi-check"
                            onClick={handleSave}
                            loading={saving}
                        />
                    </div>
                }
            >
                <div className="p-fluid">
                    <div className="field">
                        <label htmlFor="componentTitle" className="font-semibold">Component name *</label>
                        <InputText
                            id="componentTitle"
                            value={component.title || ""}
                            onChange={event => setComponent({ ...component, title: event.target.value })}
                            placeholder="e.g., Data collection"
                            className={classNames({ "p-invalid": submitted && !component.title?.trim() })}
                        />
                        {submitted && !component.title?.trim() && (
                            <small className="p-error">A component name is required.</small>
                        )}
                    </div>
                    <div className="field">
                        <label htmlFor="componentDescription" className="font-semibold">Description</label>
                        <InputTextarea
                            id="componentDescription"
                            rows={3}
                            value={component.description || ""}
                            onChange={event => setComponent({ ...component, description: event.target.value })}
                            autoResize
                        />
                    </div>
                    <div className="field mb-0">
                        <label htmlFor="componentContributors" className="font-semibold">Contributors *</label>
                        <MultiSelect
                            id="componentContributors"
                            value={(component.contributors || []).map(extractId).filter(Boolean)}
                            options={contributorOptions}
                            onChange={event => setComponent({
                                ...component,
                                contributors: event.value || []
                            })}
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select project contributors"
                            display="chip"
                            filter
                            className={classNames({ "p-invalid": submitted && !component.contributors?.length })}
                        />
                        <small className="text-600 block mt-1">
                            The Principal Investigator is intentionally excluded from component assignments.
                        </small>
                        {submitted && !component.contributors?.length && (
                            <small className="p-error block">Assign at least one non-PI contributor.</small>
                        )}
                        {!contributorOptions.length && (
                            <small className="p-error block mt-1">Add project collaborators before assigning component contributors.</small>
                        )}
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveProjectComponent;
