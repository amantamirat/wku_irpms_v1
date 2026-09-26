'use client';

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { classNames } from "primereact/utils";
import { useEffect, useRef, useState } from "react";

import { UserApi } from "@/app/(main)/users/api/user.api";
import { User } from "@/app/(main)/users/models/user.model";
import { EntitySaveDialogProps } from "@/components/createEntityManager";
import { ReviewerApi } from "../api/reviewer.api";
import { Reviewer, validateReviewer } from "../models/reviewer.model";

const SaveReviewerDialog = ({
    visible,
    item,
    onHide,
    onComplete
}: EntitySaveDialogProps<Reviewer>) => {

    const toast = useRef<Toast>(null);

    const [localReviewer, setLocalReviewer] = useState<Reviewer>({ ...item });
    const [users, setUsers] = useState<User[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const isEditMode = !!item?._id;

    useEffect(() => {
        setLocalReviewer({ ...item });
        setSubmitted(false);
        setLoading(false);
    }, [item, visible]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                if (visible) {
                    const data = await UserApi.lookup!({});
                    setUsers(data || []);
                }
            } catch (err) {
                console.error("Failed to fetch users:", err);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lookup Failed',
                    detail: 'Could not load users list.'
                });
            }
        };
        fetchUsers();
    }, [visible]);

    const saveReviewer = async () => {
        setSubmitted(true);

        const validation = validateReviewer(localReviewer);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation Warning',
                detail: validation.message
            });
            return;
        }

        try {
            setLoading(true);
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
                detail: isEditMode ? 'Reviewer updated successfully' : 'Reviewer added successfully',
                life: 3000
            });

            if (onComplete) {
                onComplete({
                    ...saved,
                    verification: localReviewer.verification,
                    application: localReviewer.application,
                    reviewer: localReviewer.reviewer
                });
            }

            onHide();

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save reviewer',
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button 
                label="Cancel" 
                icon="pi pi-times" 
                outlined 
                severity="secondary"
                onClick={onHide} 
                disabled={loading}
            />
            <Button 
                label={isEditMode ? "Save Changes" : "Create Reviewer"} 
                icon={loading ? "pi pi-spin pi-spinner" : "pi pi-check"} 
                onClick={saveReviewer} 
                disabled={loading}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className={`pi ${isEditMode ? 'pi-user-edit' : 'pi-user-plus'} text-primary text-xl`} />
                        <span className="text-xl font-bold">{isEditMode ? 'Edit Reviewer' : 'Add New Reviewer'}</span>
                    </div>
                }
                modal
                className="p-fluid shadow-lg"
                footer={footer}
                onHide={onHide}
                dismissableMask={!loading}
            >
                <div className="formgrid grid mt-2">

                    {/* Applicant selection only shown in Create Mode */}
                    {!isEditMode && (
                        <div className="field col-12 mb-4">
                            <label htmlFor="user" className="font-medium text-900 block mb-2">
                                <i className="pi pi-user mr-2 text-primary" />
                                Select Reviewer <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="user"
                                value={localReviewer.reviewer}
                                options={users}
                                onChange={(e) => setLocalReviewer({ ...localReviewer, reviewer: e.value })}
                                dataKey="_id"
                                optionLabel="name"
                                placeholder="Choose a user from the system..."
                                filter
                                showClear
                                className={classNames({ 'p-invalid': submitted && !localReviewer.reviewer })}
                            />
                            {submitted && !localReviewer.reviewer && (
                                <small className="p-error block mt-1">
                                    <i className="pi pi-exclamation-circle mr-1" /> Reviewer is required.
                                </small>
                            )}
                        </div>
                    )}

                    {/* Weight Field */}
                    <div className="field col-12 mb-2">
                        <label htmlFor="weight" className="font-medium text-900 block mb-2">
                            <i className="pi pi-sliders-h mr-2 text-primary" />
                            Weight Assignment <span className="text-red-500">*</span>
                        </label>
                        <InputNumber
                            id="weight"
                            value={localReviewer.weight}
                            onValueChange={(e) => setLocalReviewer({ ...localReviewer, weight: e.value ?? 1 })}
                            min={0}
                            mode="decimal"
                            showButtons
                            placeholder="Enter weight value"
                            className={classNames({ 'p-invalid': submitted && (localReviewer.weight === null || localReviewer.weight === undefined) })}
                        />
                        <small className="text-color-secondary block mt-1">
                            Defines the distribution weight for this reviewer.
                        </small>
                    </div>

                </div>
            </Dialog>
        </>
    );
};

export default SaveReviewerDialog;