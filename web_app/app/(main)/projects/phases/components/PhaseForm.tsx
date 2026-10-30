'use client';

import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import { FormEvent, useEffect, useState } from 'react';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Project } from '@/app/(main)/projects/models/project.model';
import { Phase } from '../models/phase.model';
import { computeDurationFromDates } from '@/utils/utils';

interface PhaseFormProps extends ItemFormRenderProps<Phase> {
    project?: Project | string | null;
}

const PhaseForm = ({
    mode,
    item,
    saving,
    formId,
    onSubmit,
    project
}: PhaseFormProps) => {
    const [localItem, setLocalItem] = useState<Phase>({
        ...(item ?? {}),
        project: project ?? item?.project ?? null,
        startDate: item?.startDate
            ? new Date(item.startDate)
            : null,
        endDate: item?.endDate
            ? new Date(item.endDate)
            : null,
        duration: item?.duration ?? 0,
        budget: item?.budget ?? 0
    } as Phase);

    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalItem({
            ...(item ?? {}),
            project: project ?? item?.project ?? null,
            startDate: item?.startDate
                ? new Date(item.startDate)
                : null,
            endDate: item?.endDate
                ? new Date(item.endDate)
                : null,
            duration: item?.duration ?? 0,
            budget: item?.budget ?? 0
        } as Phase);

        setSubmitted(false);
    }, [item, project]);

    const projectMissing = !localItem.project;
    const durationInvalid =
        localItem.duration == null || localItem.duration < 1;
    const budgetInvalid =
        localItem.budget == null || localItem.budget < 0;

    const startDateProvided = !!localItem.startDate;
    const endDateProvided = !!localItem.endDate;

    // If one is provided, the other must be provided as well
    const incompleteDatePair =
        (startDateProvided && !endDateProvided) ||
        (!startDateProvided && endDateProvided);

    const dateRangeInvalid =
        startDateProvided &&
        endDateProvided &&
        new Date(localItem.endDate!).getTime() <
        new Date(localItem.startDate!).getTime();



    const durationSpanMismatch =
        startDateProvided &&
        endDateProvided &&
        !dateRangeInvalid &&
        localItem.duration != null &&
        computeDurationFromDates(localItem.startDate!, localItem.endDate!) !== localItem.duration;


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            saving ||
            projectMissing ||
            durationInvalid ||
            budgetInvalid ||
            incompleteDatePair ||
            dateRangeInvalid ||
            durationSpanMismatch
        ) {
            return;
        }

        await onSubmit({
            ...localItem,
            project: localItem.project,
            startDate: localItem.startDate ? new Date(localItem.startDate) : null,
            endDate: localItem.endDate ? new Date(localItem.endDate) : null
        });
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid"
            noValidate
        >
            <div className="grid">
                {/* Project validation */}
                {submitted && projectMissing && (
                    <div className="field col-12">
                        <small className="p-error block">
                            A project is required. Please provide a project.
                        </small>
                    </div>
                )}

                {/* Budget */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="budget"
                        className="font-bold text-sm block mb-2"
                    >
                        Budget (ETB){' '}
                        <span className="text-red-500">*</span>
                    </label>

                    <InputNumber
                        id="budget"
                        value={localItem.budget}
                        onValueChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                budget: e.value ?? 0
                            }))
                        }
                        min={0}
                        mode="currency"
                        currency="ETB"
                        locale="en-ET"
                        placeholder="Enter budget"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && budgetInvalid
                        })}
                    />

                    {submitted && budgetInvalid && (
                        <small className="p-error block mt-1">
                            Budget must be zero or greater.
                        </small>
                    )}
                </div>

                {/* Duration */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="duration"
                        className="font-bold text-sm block mb-2"
                    >
                        Duration (Days){' '}
                        <span className="text-red-500">*</span>
                    </label>

                    <InputNumber
                        id="duration"
                        value={localItem.duration}
                        onValueChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                duration: e.value ?? 0
                            }))
                        }
                        min={1}
                        useGrouping={false}
                        placeholder="Enter duration"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && durationInvalid
                        })}
                    />

                    {submitted && durationInvalid && (
                        <small className="p-error block mt-1">
                            Duration must be at least one day.
                        </small>
                    )}
                </div>

                {/* Start Date */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="startDate"
                        className="font-bold text-sm block mb-2"
                    >
                        Start Date
                    </label>

                    <Calendar
                        id="startDate"
                        value={localItem.startDate ?? null}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                startDate: e.value ?? null
                            }))
                        }
                        dateFormat="yy-mm-dd"
                        showIcon
                        placeholder="Select start date"
                        disabled={saving}
                        className={classNames({
                            'p-invalid':
                                submitted &&
                                (incompleteDatePair ||
                                    dateRangeInvalid ||
                                    durationSpanMismatch)
                        })}
                    />

                    {submitted && incompleteDatePair && (
                        <small className="p-error block mt-1">
                            Both start date and end date must be provided together.
                        </small>
                    )}

                    {submitted && durationSpanMismatch && (
                        <small className="p-error block mt-1">
                            The date span must match the specified duration.
                        </small>
                    )}
                </div>

                {/* End Date */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="endDate"
                        className="font-bold text-sm block mb-2"
                    >
                        End Date
                    </label>

                    <Calendar
                        id="endDate"
                        value={localItem.endDate ?? null}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                endDate: e.value ?? null
                            }))
                        }
                        dateFormat="yy-mm-dd"
                        showIcon
                        minDate={
                            localItem.startDate
                                ? new Date(localItem.startDate)
                                : undefined
                        }
                        placeholder="Select end date"
                        disabled={saving}
                        className={classNames({
                            'p-invalid':
                                submitted &&
                                (incompleteDatePair ||
                                    dateRangeInvalid ||
                                    durationSpanMismatch)
                        })}
                    />

                    {submitted && incompleteDatePair && (
                        <small className="p-error block mt-1">
                            Both start date and end date must be provided together.
                        </small>
                    )}

                    {submitted && dateRangeInvalid && (
                        <small className="p-error block mt-1">
                            End date cannot be before the start date.
                        </small>
                    )}

                    {submitted && durationSpanMismatch && (
                        <small className="p-error block mt-1">
                            The date span must match the specified duration.
                        </small>
                    )}
                </div>
            </div>
        </form>
    );
};

export default PhaseForm;