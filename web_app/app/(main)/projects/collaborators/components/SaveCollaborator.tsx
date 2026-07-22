'use client';

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";

import { UserApi } from "@/app/(main)/users/api/user.api";
import { User } from "@/app/(main)/users/models/user.model";
import { userTemplate } from "@/app/(main)/users/models/user.template";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator, roleOptions } from "../models/collaborator.model";
import { EntitySaveDialogProps } from "@/components/createEntityManager";

const SaveCollaborator = ({
    visible,
    item,
    onHide,
    onComplete
}: EntitySaveDialogProps<Collaborator>) => {

    const toast = useRef<Toast>(null);
    const [localCollaborator, setLocalCollaborator] = useState<Collaborator>({ ...item });
    const [applicants, setApplicants] = useState<User[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const isEditMode = !!item?._id;

    // Reset local state when item or visibility changes
    useEffect(() => {
        if (visible) {
            setLocalCollaborator({ ...item });
            setSubmitted(false);
        }
    }, [item, visible]);

    // Professional Fetching: Only load users if we are ADDING a new collaborator
    useEffect(() => {
        const fetchUsers = async () => {
            if (visible && !isEditMode) {
                setLoading(true);
                try {
                    const data = await UserApi.getAll({});
                    setApplicants(data);
                } catch (err) {
                    console.error("Failed to fetch applicants:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchUsers();
    }, [visible, isEditMode]);

    const validate = () => {
        if (!localCollaborator.applicant) return { valid: false, message: "Collaborator is required" };
        if (!localCollaborator.role) return { valid: false, message: "Role is required" };
        return { valid: true };
    };

    const saveCollaborator = async () => {
        setSubmitted(true);
        const validation = validate();
        
        if (!validation.valid) {
            toast.current?.show({ severity: 'warn', summary: 'Validation', detail: validation.message });
            return;
        }

        try {
            const saved = localCollaborator._id
                ? await CollaboratorApi.update(localCollaborator)
                : await CollaboratorApi.create(localCollaborator);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Collaborator saved' });

            if (onComplete) {
                // Pass back the saved object merged with the selected applicant for UI immediate update
                onComplete({
                    ...saved,
                    applicant: localCollaborator.applicant,
                });
            }
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to save' });
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} className="p-button-secondary" />
            <Button label={isEditMode ? "Update Member" : "Add Member"} icon="pi pi-check" onClick={saveCollaborator} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={isEditMode ? 'Edit Team Member' : 'Add Team Member'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="grid">
                    {/* Collaborator Selection */}
                    <div className="field col-12 mt-2">
                        <label htmlFor="applicant" className="font-bold">Collaborator</label>
                        <Dropdown
                            id="applicant"
                            value={localCollaborator.applicant}
                            // In edit mode, we just use the current applicant as the only option
                            options={isEditMode ? [localCollaborator.applicant as User] : applicants}
                            onChange={(e) => setLocalCollaborator({ ...localCollaborator, applicant: e.value })}
                            dataKey="_id"
                            optionLabel="name"
                            itemTemplate={userTemplate}
                            valueTemplate={(option) =>
                                option ? userTemplate(option) : <span className="p-placeholder">Select a Person</span>
                            }
                            disabled={isEditMode}
                            //loading={loading}
                            placeholder="Search by name..."
                            filter
                            className={classNames({ 'p-invalid': submitted && !localCollaborator.applicant })}
                        />
                        {submitted && !localCollaborator.applicant && (
                            <small className="p-error">Please select a team member.</small>
                        )}
                    </div>

                    {/* Role Selection */}
                    <div className="field col-12">
                        <label htmlFor="role" className="font-bold">Project Role</label>
                        <Dropdown
                            id="role"
                            value={localCollaborator.role}
                            options={roleOptions}
                            onChange={(e) => setLocalCollaborator({ ...localCollaborator, role: e.value })}
                            placeholder="Select or type a role"
                            editable
                            className={classNames({ 'p-invalid': submitted && !localCollaborator.role })}
                        />
                        {submitted && !localCollaborator.role && (
                            <small className="p-error">Role is required.</small>
                        )}
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveCollaborator;