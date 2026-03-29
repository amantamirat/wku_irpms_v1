'use client';

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";

import { ApplicantApi } from "@/app/(main)/applicants/api/applicant.api";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { applicantTemplate } from "@/app/(main)/applicants/models/applicant.template";
import { CollaboratorApi } from "../api/collaborator.api";
import { Collaborator } from "../models/collaborator.model";
import { EntitySaveDialogProps } from "@/components/createEntityManager";

const SaveCollaborator = ({
    visible,
    item,
    onHide,
    onComplete
}: EntitySaveDialogProps<Collaborator>) => {

    const toast = useRef<Toast>(null);

    const [localCollaborator, setLocalCollaborator] = useState<Collaborator>({ ...item });
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const isEditMode = !!item?._id;

    useEffect(() => {
        setLocalCollaborator({ ...item });
        setSubmitted(false);
    }, [item, visible]);

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                if (visible) {
                    const data = await ApplicantApi.getAll({});
                    setApplicants(data);
                }
            } catch (err) {
                console.error("Failed to fetch applicants:", err);
            }
        };
        fetchApplicants();
    }, [visible]);

    const validate = () => {
        if (!localCollaborator.applicant) {
            return { valid: false, message: "Collaborator is required" };
        }
        return { valid: true };
    };

    const saveCollaborator = async () => {
        setSubmitted(true);

        const validation = validate();
        if (!validation.valid) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation',
                detail: validation.message
            });
            return;
        }

        try {
            const saved = localCollaborator._id
                ? { ...localCollaborator } // or await CollaboratorApi.update(localCollaborator)
                : await CollaboratorApi.create(localCollaborator);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Collaborator saved'
            });

            if (onComplete) {
                onComplete({
                    ...saved,
                    project: localCollaborator.project,
                    applicant: localCollaborator.applicant
                });
            }

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save collaborator'
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save Collaborator" icon="pi pi-check" onClick={saveCollaborator} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={isEditMode ? 'Edit Collaborator' : 'Add Collaborator'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="formgrid grid">

                    {/* Collaborator Field */}
                    <div className="field col-12">
                        <label htmlFor="applicant" className="font-bold">
                            Collaborator
                        </label>

                        <Dropdown
                            id="applicant"
                            value={localCollaborator.applicant}
                            options={applicants}
                            onChange={(e) =>
                                setLocalCollaborator({
                                    ...localCollaborator,
                                    applicant: e.value
                                })
                            }
                            dataKey="_id"
                            optionLabel="first_name"
                            itemTemplate={applicantTemplate}
                            valueTemplate={(option) =>
                                option
                                    ? applicantTemplate(option)
                                    : <span className="p-placeholder">Select a Collaborator</span>
                            }
                            placeholder="Select a Collaborator"
                            filter
                            className={classNames({
                                'p-invalid': submitted && !localCollaborator.applicant
                            })}
                        />

                        {submitted && !localCollaborator.applicant && (
                            <small className="p-error">
                                Collaborator is required.
                            </small>
                        )}
                    </div>

                </div>
            </Dialog>
        </>
    );
};

export default SaveCollaborator;