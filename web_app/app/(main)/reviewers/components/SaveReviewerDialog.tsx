'use client';

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { InputNumber } from "primereact/inputnumber";
import { classNames } from "primereact/utils";

import { ApplicantApi } from "@/app/(main)/applicants/api/applicant.api";
import { Applicant } from "@/app/(main)/applicants/models/applicant.model";
import { applicantTemplate } from "@/app/(main)/applicants/models/applicant.template";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, validateReviewer } from "../models/reviewer.model";
import { EntitySaveDialogProps } from "@/components/createEntityManager";

const SaveReviewerDialog = ({
    visible,
    item,
    onHide,
    onComplete
}: EntitySaveDialogProps<Reviewer>) => {

    const toast = useRef<Toast>(null);

    const [localReviewer, setLocalReviewer] = useState<Reviewer>({ ...item });
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [submitted, setSubmitted] = useState(false);

    const isEditMode = !!item?._id;

    useEffect(() => {
        setLocalReviewer({ ...item });
        setSubmitted(false);
    }, [item, visible]);

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                if (visible) {
                    // Fetching all applicants directly as requested (no workspace filter)
                    const data = await ApplicantApi.getAll({});
                    setApplicants(data);
                }
            } catch (err) {
                console.error("Failed to fetch applicants:", err);
            }
        };
        fetchApplicants();
    }, [visible]);

    const saveReviewer = async () => {
        setSubmitted(true);

        const validation = validateReviewer(localReviewer);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation',
                detail: validation.message
            });
            return;
        }

        try {
            let saved: Reviewer;
            if (isEditMode) {
                saved = await ReviewerApi.update({ 
                    _id: localReviewer._id, 
                    weight: localReviewer.weight 
                });
            } else {
                saved = await ReviewerApi.create(localReviewer);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Reviewer saved'
            });

            if (onComplete) {
                onComplete({
                    ...saved,
                    projectStage: localReviewer.projectStage,
                    applicant: localReviewer.applicant
                });
            }

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save reviewer'
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save Reviewer" icon="pi pi-check" onClick={saveReviewer} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={isEditMode ? 'Edit Reviewer' : 'Add Reviewer'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="formgrid grid">
                    
                    {/* Applicant selection only shown in Create Mode */}
                    {!isEditMode && (
                        <div className="field col-12">
                            <label htmlFor="applicant" className="font-bold">
                                Reviewer (Applicant)
                            </label>
                            <Dropdown
                                id="applicant"
                                value={localReviewer.applicant}
                                options={applicants}
                                onChange={(e) => setLocalReviewer({ ...localReviewer, applicant: e.value })}
                                dataKey="_id"
                                optionLabel="first_name"
                                itemTemplate={applicantTemplate}
                                valueTemplate={(option) =>
                                    option ? applicantTemplate(option) : <span className="p-placeholder">Select a Reviewer</span>
                                }
                                placeholder="Select an Applicant"
                                filter
                                className={classNames({
                                    'p-invalid': submitted && !localReviewer.applicant
                                })}
                            />
                            {submitted && !localReviewer.applicant && (
                                <small className="p-error">Reviewer is required.</small>
                            )}
                        </div>
                    )}

                    {/* Weight Field */}
                    <div className="field col-12">
                        <label htmlFor="weight" className="font-bold">
                            Weight
                        </label>
                        <InputNumber
                            id="weight"
                            value={localReviewer.weight}
                            onValueChange={(e) => setLocalReviewer({ ...localReviewer, weight: e.value ?? 1 })}
                            min={0}
                            placeholder="Enter weight"
                            className={classNames({
                                'p-invalid': submitted && (localReviewer.weight === null || localReviewer.weight === undefined)
                            })}
                        />
                    </div>

                </div>
            </Dialog>
        </>
    );
};

export default SaveReviewerDialog;