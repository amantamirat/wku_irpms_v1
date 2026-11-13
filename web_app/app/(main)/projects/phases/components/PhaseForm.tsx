'use client';

import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Project } from '@/app/(main)/projects/models/project.model';
import { Phase } from '../models/phase.model';
import { computeDurationFromDates, formatDuration } from '@/utils/utils';
import {
    FieldError,
    FieldHint,
    FieldLabel,
    LockedField,
    StatCard
} from '@/templates/FormPrimitives';

interface PhaseFormProps extends ItemFormRenderProps<Phase> {
    project?: Project | string | null;
}

const etbCurrencyFormatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB'
});

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * End date for a start date + duration. Verifies against
 * computeDurationFromDates so it works whether that helper counts inclusively or not.
 */
const deriveEndDate = (start: Date, duration: number): Date => {
    const inclusive = addDays(start, duration - 1);
    return computeDurationFromDates(start, inclusive) === duration
        ? inclusive
        : addDays(start, duration);
};

const isValidRange = (start: Date | null, end: Date | null) =>
    !!start && !!end && end.getTime() >= start.getTime();

const buildInitialState = (
    item: Phase | null | undefined,
    project?: Project | string | null
): Phase => {
    const startDate = item?.startDate ? new Date(item.startDate) : null;
    const endDate = item?.endDate ? new Date(item.endDate) : null;

    // Dates win; otherwise keep the legacy duration so it can seed the dates.
    const duration = isValidRange(startDate, endDate)
        ? computeDurationFromDates(startDate!, endDate!)
        : item?.duration ?? 0;

    return {
        ...(item ?? {}),
        project: project ?? item?.project ?? null,
        startDate,
        endDate,
        duration,
        budget: item?.budget ?? 0
    } as Phase;
};

const PhaseForm = ({
    mode,
    item,
    saving,
    formId,
    onSubmit,
    project
}: PhaseFormProps) => {
    const [localItem, setLocalItem] = useState<Phase>(() =>
        buildInitialState(item, project)
    );
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalItem(buildInitialState(item, project));
        setSubmitted(false);
    }, [item, project]);

    const handleStartChange = (start: Date | null) => {
        setLocalItem((prev) => {
            const end = prev.endDate ? new Date(prev.endDate) : null;

            if (!start) return { ...prev, startDate: null };

            // Both dates -> duration is calculated from them
            if (end) {
                return {
                    ...prev,
                    startDate: start,
                    duration: isValidRange(start, end)
                        ? computeDurationFromDates(start, end)
                        : 0
                };
            }

            // Legacy record: duration exists, so derive the end date from it
            if ((prev.duration ?? 0) >= 1) {
                return {
                    ...prev,
                    startDate: start,
                    endDate: deriveEndDate(start, prev.duration)
                };
            }

            return { ...prev, startDate: start };
        });
    };

    const handleEndChange = (end: Date | null) => {
        setLocalItem((prev) => {
            const start = prev.startDate ? new Date(prev.startDate) : null;

            if (start && end) {
                return {
                    ...prev,
                    endDate: end,
                    duration: isValidRange(start, end)
                        ? computeDurationFromDates(start, end)
                        : 0
                };
            }

            return { ...prev, endDate: end };
        });
    };

    // Duration is editable only while no dates are set (legacy records)
    const durationEditable = !localItem.startDate && !localItem.endDate;

    // ---- Validation -------------------------------------------------------
    const projectMissing = !localItem.project;
    const budgetInvalid =
        localItem.budget == null || localItem.budget < 0;

    const startDateMissing = !localItem.startDate;
    const endDateMissing = !localItem.endDate;

    const dateRangeInvalid = useMemo(
        () =>
            !!localItem.startDate &&
            !!localItem.endDate &&
            new Date(localItem.endDate).getTime() <
            new Date(localItem.startDate).getTime(),
        [localItem.startDate, localItem.endDate]
    );

    const hasValidDuration = (localItem.duration ?? 0) >= 1;

    const durationLabel = hasValidDuration
        ? `${localItem.duration} ${localItem.duration === 1 ? 'day' : 'days'}`
        : 'Select start and end dates';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            saving ||
            projectMissing ||
            budgetInvalid ||
            startDateMissing ||
            endDateMissing ||
            dateRangeInvalid ||
            !hasValidDuration
        ) {
            return;
        }

        await onSubmit({
            ...localItem,
            project: localItem.project,
            startDate: new Date(localItem.startDate!),
            endDate: new Date(localItem.endDate!),
            duration: localItem.duration
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
                        <FieldError show>
                            A project is required. Please provide a project.
                        </FieldError>
                    </div>
                )}

                {/* Budget */}
                <div className="col-12">
                    <StatCard
                        icon="pi-money-bill"
                        label="Budget"
                        color="green"
                        required
                    >
                        <InputNumber
                            inputId="phase-budget"
                            value={localItem.budget ?? null}
                            onValueChange={(e) =>
                                setLocalItem((prev) => ({
                                    ...prev,
                                    budget: e.value ?? 0
                                }))
                            }
                            mode="currency"
                            currency="ETB"
                            locale="en-US"
                            min={0}
                            maxFractionDigits={2}
                            disabled={saving}
                            placeholder="0.00"
                            inputClassName={classNames('font-bold text-lg', {
                                'p-invalid': submitted && budgetInvalid
                            })}
                        />
                        <FieldError show={submitted && budgetInvalid}>
                            Budget must be zero or greater.
                        </FieldError>
                        <FieldHint>
                            {localItem.budget
                                ? `≈ ${etbCurrencyFormatter.format(localItem.budget)}`
                                : 'Estimated cost of this phase.'}
                        </FieldHint>
                    </StatCard>
                </div>

                {/* Start Date */}
                <div className="field col-12 md:col-6">
                    <FieldLabel htmlFor="startDate" required>
                        Start Date
                    </FieldLabel>

                    <Calendar
                        inputId="startDate"
                        value={localItem.startDate ?? null}
                        onChange={(e) =>
                            handleStartChange((e.value as Date | null) ?? null)
                        }
                        dateFormat="yy-mm-dd"
                        showIcon
                        placeholder="Select start date"
                        disabled={saving}
                        className={classNames({
                            'p-invalid':
                                submitted &&
                                (startDateMissing || dateRangeInvalid)
                        })}
                    />

                    <FieldError show={submitted && startDateMissing}>
                        Start date is required.
                    </FieldError>
                </div>

                {/* End Date */}
                <div className="field col-12 md:col-6">
                    <FieldLabel htmlFor="endDate" required>
                        End Date
                    </FieldLabel>

                    <Calendar
                        inputId="endDate"
                        value={localItem.endDate ?? null}
                        onChange={(e) =>
                            handleEndChange((e.value as Date | null) ?? null)
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
                                (endDateMissing || dateRangeInvalid)
                        })}
                    />

                    <FieldError show={submitted && endDateMissing}>
                        End date is required.
                    </FieldError>
                    <FieldError show={submitted && dateRangeInvalid}>
                        End date cannot be before the start date.
                    </FieldError>
                </div>

                {/* Duration (auto-calculated, locked) */}
                <div className="col-12">
                    <StatCard
                        icon="pi-calendar-clock"
                        label="Duration"
                        color="blue"
                    >
                        {durationEditable ? (
                            <InputNumber
                                inputId="phase-duration"
                                value={localItem.duration || null}
                                onValueChange={(e) =>
                                    setLocalItem((prev) => ({
                                        ...prev,
                                        duration: e.value ?? 0
                                    }))
                                }
                                min={0}
                                useGrouping={false}
                                suffix=" days"
                                disabled={saving}
                                placeholder="0 days"
                                inputClassName="font-bold text-lg"
                            />
                        ) : (
                            <LockedField
                                id="phase-duration"
                                value={durationLabel}
                            />
                        )}
                        <FieldHint>
                            {durationEditable
                                ? 'Enter a duration, then pick a start date. The end date fills in automatically.'
                                : localItem.duration
                                    ? `≈ ${formatDuration(localItem.duration)} (calculated from the dates)`
                                    : 'Select start and end dates to calculate the duration.'}
                        </FieldHint>
                    </StatCard>
                </div>
            </div>
        </form>
    );
};

export default PhaseForm;
