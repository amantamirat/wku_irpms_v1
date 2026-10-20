'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Calendar, validateCalendar } from '../models/calendar.model';

const createInitialCalendar = (
    item: Partial<Calendar> | null | undefined
): Calendar => ({
    ...item,
    year: item?.year ?? new Date().getFullYear(),
    startDate: item?.startDate ?? null,
    endDate: item?.endDate ?? null,
});

const CalendarForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Calendar>) => {
    const [localCalendar, setLocalCalendar] = useState<Calendar>(
        () => createInitialCalendar(item)
    );
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalCalendar(createInitialCalendar(item));
        setSubmitted(false);
    }, [item]);

    const updateField = <K extends keyof Calendar>(
        field: K,
        value: Calendar[K]
    ) => {
        setLocalCalendar((previous) => {
            const updated = { ...previous, [field]: value };
            
            // UX Enhancement: If start date changes and is after end date, clear or sync end date
            if (field === 'startDate' && value && updated.endDate) {
                if (new Date(value as string) > new Date(updated.endDate)) {
                    updated.endDate = null;
                }
            }
            
            // Auto-sync year if start date is provided
            if (field === 'startDate' && value) {
                const dateObj = new Date(value as string);
                if (!isNaN(dateObj.getFullYear())) {
                    updated.year = dateObj.getFullYear();
                }
            }

            return updated;
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const validation = validateCalendar(localCalendar);
        if (!validation.valid) return;

        await onSubmit({
            ...localCalendar,
            year: Number(localCalendar.year)
        });
    };

    const yearInvalid = submitted && !localCalendar.year;
    const startDateInvalid = submitted && !localCalendar.startDate;
    const endDateInvalid = submitted && !localCalendar.endDate;

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid flex flex-column gap-4"
            noValidate
        >
            {/* Section Header / Description */}
            <div className="surface-border border-bottom-1 pb-2">
                <span className="text-color-secondary text-sm">
                    Configure the academic or operational year timeframe, including active start and end dates.
                </span>
            </div>

            <div className="formgrid grid gap-3 md:gap-0">
                {/* Year Field */}
                <div className="field col-12">
                    <label htmlFor="year" className="font-medium flex align-items-center gap-2 mb-2">
                        <i className="pi pi-bookmark text-primary"></i>
                        <span>Target Year</span>
                    </label>
                    <InputNumber
                        id="year"
                        value={localCalendar.year}
                        onValueChange={(event) =>
                            updateField('year', event.value ?? 0)
                        }
                        useGrouping={false}
                        showButtons
                        min={1900}
                        max={2100}
                        disabled={saving}
                        className={classNames({ 'p-invalid': yearInvalid })}
                    />
                    {yearInvalid && (
                        <small className="p-error mt-1 block">
                            <i className="pi pi-exclamation-circle mr-1"></i>Year is required.
                        </small>
                    )}
                </div>

                {/* Date Range Section Grid */}
                <div className="col-12 grid formgrid mt-1">
                    {/* Start Date */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="startDate" className="font-medium flex align-items-center gap-2 mb-2">
                            <i className="pi pi-calendar-plus text-primary"></i>
                            <span>Start Date</span>
                        </label>
                        <PrimeCalendar
                            id="startDate"
                            value={
                                localCalendar.startDate
                                    ? new Date(localCalendar.startDate)
                                    : null
                            }
                            onChange={(event) =>
                                updateField('startDate', event.value ?? null)
                            }
                            dateFormat="yy-mm-dd"
                            showIcon
                            disabled={saving}
                            placeholder="Select start date"
                            className={classNames({ 'p-invalid': startDateInvalid })}
                        />
                        {startDateInvalid && (
                            <small className="p-error mt-1 block">
                                <i className="pi pi-exclamation-circle mr-1"></i>Start date is required.
                            </small>
                        )}
                    </div>

                    {/* End Date */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="endDate" className="font-medium flex align-items-center gap-2 mb-2">
                            <i className="pi pi-calendar-minus text-primary"></i>
                            <span>End Date</span>
                        </label>
                        <PrimeCalendar
                            id="endDate"
                            value={
                                localCalendar.endDate
                                    ? new Date(localCalendar.endDate)
                                    : null
                            }
                            onChange={(event) =>
                                updateField('endDate', event.value ?? null)
                            }
                            dateFormat="yy-mm-dd"
                            showIcon
                            disabled={saving}
                            minDate={
                                localCalendar.startDate
                                    ? new Date(localCalendar.startDate)
                                    : undefined
                            }
                            placeholder="Select end date"
                            className={classNames({ 'p-invalid': endDateInvalid })}
                        />
                        {endDateInvalid && (
                            <small className="p-error mt-1 block">
                                <i className="pi pi-exclamation-circle mr-1"></i>End date is required.
                            </small>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
};

export default CalendarForm;