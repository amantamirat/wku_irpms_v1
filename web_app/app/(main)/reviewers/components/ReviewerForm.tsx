'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { UserApi } from '@/app/(main)/users/api/user.api';
import { User } from '@/app/(main)/users/models/user.model';
import {
    Reviewer,
    ReviewerTargetType,
} from '../models/reviewer.model';
import { extractId } from '@/utils/utils';

type ReviewerFormProps = ItemFormRenderProps<Reviewer> & {
    targetType: ReviewerTargetType;
    targetId?: string;
};

const getValidationError = (payload: Reviewer): string | null => {
    if (!payload.reviewer) {
        return 'Reviewer is required.';
    }
    if (
        payload.targetType === ReviewerTargetType.APPLICATION &&
        !payload.application
    ) {
        return 'Application is required.';
    }
    if (
        payload.targetType === ReviewerTargetType.VERIFICATION &&
        !payload.verification
    ) {
        return 'Verification is required.';
    }
    return null;
};

const ReviewerForm = ({
    item,
    saving,
    formId,
    onSubmit,
    targetType,
    targetId,
}: ReviewerFormProps) => {
    const [localReviewer, setLocalReviewer] = useState<Partial<Reviewer>>({});
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    const isEditMode = !!item?._id;

    // Initialize the form, keeping the reviewer as-is (object or id).
    useEffect(() => {
        setSubmitted(false);
        setErrorMessage(null);

        setLocalReviewer({
            ...item,
            weight: item?.weight ?? 1,
        });
    }, [item]);

    // Load users for reviewer selection and name resolution.
    useEffect(() => {
        let active = true;

        UserApi.lookup!({})
            .then((data) => {
                if (active) {
                    setUsers(data || []);
                }
            })
            .catch((error) => {
                console.error('Failed to load users:', error);
            });

        return () => {
            active = false;
        };
    }, []);

    const updateReviewer = (changes: Partial<Reviewer>) => {
        setLocalReviewer((previous) => ({
            ...previous,
            ...changes,
        }));
    };

    // Always resolve the reviewer to a full user object when possible.
    const resolveReviewer = (
        value: Reviewer['reviewer'] | undefined
    ): Reviewer['reviewer'] | undefined => {
        if (!value) return undefined;
        if (typeof value === 'object') return value;

        return (
            (users.find((user) => user._id === value) as Reviewer['reviewer']) ??
            value
        );
    };

    const selectedReviewer = resolveReviewer(localReviewer.reviewer);

    const getReviewerName = () => {
        if (typeof selectedReviewer === 'object' && selectedReviewer !== null) {
            return (selectedReviewer as User).name || '-';
        }
        return '-';
    };

    const buildPayload = (): Reviewer => {
        const payload = {
            ...localReviewer,
            reviewer: resolveReviewer(localReviewer.reviewer),
            targetType,
            application: undefined,
            verification: undefined,
        } as Reviewer;

        if (targetType === ReviewerTargetType.APPLICATION) {
            payload.application =
                targetId ??
                extractId(localReviewer.application) ??
                undefined;
        } else if (targetType === ReviewerTargetType.VERIFICATION) {
            payload.verification =
                targetId ??
                extractId(localReviewer.verification) ??
                undefined;
        }

        return payload;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const payload = buildPayload();
        const error = getValidationError(payload);

        if (error) {
            setErrorMessage(error);
            return;
        }

        setErrorMessage(null);
        await onSubmit(payload);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            <div className="card p-4 surface-card border-round shadow-1">
                {errorMessage && (
                    <div className="p-error mb-3">
                        <i className="pi pi-exclamation-circle mr-1" />
                        {errorMessage}
                    </div>
                )}

                {/* Reviewer */}
                <div className="field col-12 mb-3">
                    <label
                        htmlFor="reviewer-user"
                        className="font-bold block mb-2"
                    >
                        <i className="pi pi-user mr-2 text-primary" />
                        Reviewer <span className="p-error">*</span>
                    </label>

                    {isEditMode ? (
                        <div className="p-inputtext p-component surface-100">
                            {getReviewerName()}
                        </div>
                    ) : (
                        <>
                            <Dropdown
                                inputId="reviewer-user"
                                value={selectedReviewer ?? null}
                                options={users}
                                optionLabel="name"
                                dataKey="_id"
                                placeholder="Choose a user from the system..."
                                filter
                                showClear
                                onChange={(event) =>
                                    updateReviewer({
                                        reviewer: (event.value ??
                                            undefined) as Reviewer['reviewer'],
                                    })
                                }
                                className={classNames({
                                    'p-invalid': submitted && !localReviewer.reviewer,
                                })}
                            />

                            {submitted && !localReviewer.reviewer && (
                                <small className="p-error block mt-1">
                                    <i className="pi pi-exclamation-circle mr-1" />
                                    Reviewer is required.
                                </small>
                            )}
                        </>
                    )}
                </div>

                {/* Weight */}
                <div className="field col-12">
                    <label
                        htmlFor="reviewer-weight"
                        className="font-bold block mb-2"
                    >
                        <i className="pi pi-sliders-h mr-2 text-primary" />
                        Weight Assignment <span className="p-error">*</span>
                    </label>

                    <InputNumber
                        inputId="reviewer-weight"
                        value={localReviewer.weight ?? 1}
                        min={0}
                        mode="decimal"
                        showButtons
                        placeholder="Enter weight value"
                        onValueChange={(event) =>
                            updateReviewer({
                                weight: event.value ?? 1,
                            })
                        }
                        className={classNames({
                            'p-invalid':
                                submitted &&
                                (localReviewer.weight === null ||
                                    localReviewer.weight === undefined),
                        })}
                    />

                    <small className="text-color-secondary block mt-1">
                        Defines the distribution weight for this reviewer.
                    </small>
                </div>
            </div>

            {/* Submitted by the ItemManager dialog footer */}
            <button type="submit" hidden disabled={saving} />
        </form>
    );
};

export default ReviewerForm;