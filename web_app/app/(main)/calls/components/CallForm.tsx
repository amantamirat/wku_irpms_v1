'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { extractId } from '@/utils/utils';

import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';
import {
    Calendar,
    CalendarStatus,
} from '@/app/(main)/calendars/models/calendar.model';

import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { GrantStatus } from '@/app/(main)/grants/models/grant.state-machine';
import { Call } from '../models/call.model';

const CallForm = ({
    item,
    saving,
    formId,
    onSubmit,
}: ItemFormRenderProps<Call>) => {
    const [localCall, setLocalCall] = useState<Partial<Call>>({});
    const [submitted, setSubmitted] = useState(false);

    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);

    const isEditMode = !!item?._id;

    // Initialize/reset the form when the selected item changes.
    useEffect(() => {
        setSubmitted(false);
        setLocalCall({
            ...item,
        });
    }, [item]);

    // Load supporting resources / dependencies.
    useEffect(() => {
        let active = true;

        Promise.all([
            GrantApi.lookup!({ status: GrantStatus.active }),
            CalendarApi.lookup!({ status: CalendarStatus.active }),
        ])
            .then(([grantData, calendarData]) => {
                if (!active) return;

                setGrants(grantData || []);
                setCalendars(calendarData || []);
            })
            .catch(console.error);

        return () => {
            active = false;
        };
    }, []);

    const updateCall = (changes: Partial<Call>) => {
        setLocalCall((previous) => ({
            ...previous,
            ...changes,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (!localCall.calendar) return;
        if (!localCall.grant) return;
        if (!localCall.title?.trim()) return;

        await onSubmit(localCall);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid">
            <div className="card p-4 surface-card border-round shadow-1">
                {/* Operational Year & Grant */}
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <label htmlFor="call-calendar" className="font-bold block mb-2">
                            Operational Year <span className="p-error">*</span>
                        </label>
                        <Dropdown
                            inputId="call-calendar"
                            value={extractId(localCall.calendar) ?? null}
                            options={calendars}
                            optionLabel="year"
                            optionValue="_id"
                            dataKey="_id"
                            placeholder="Select Operational Year"
                            onChange={(event) =>
                                updateCall({ calendar: event.value })
                            }
                            className={classNames({
                                'p-invalid': submitted && !localCall.calendar,
                            })}
                        />
                        {submitted && !localCall.calendar && (
                            <small className="p-error block mt-1">
                                Operational Year is required.
                            </small>
                        )}
                    </div>

                    <div className="field col-12 md:col-6">
                        <label htmlFor="call-grant" className="font-bold block mb-2">
                            Grant <span className="p-error">*</span>
                        </label>
                        <Dropdown
                            inputId="call-grant"
                            value={extractId(localCall.grant) ?? null}
                            options={grants}
                            optionLabel="title"
                            optionValue="_id"
                            placeholder="Select Grant"
                            disabled={isEditMode}
                            onChange={(event) =>
                                updateCall({ grant: event.value })
                            }
                            className={classNames({
                                'p-invalid': submitted && !localCall.grant,
                            })}
                        />
                        {submitted && !localCall.grant && (
                            <small className="p-error block mt-1">
                                Grant selection is required.
                            </small>
                        )}
                    </div>
                </div>

                {/* Call Title */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12">
                        <label htmlFor="call-title" className="font-bold block mb-2">
                            Call Title <span className="p-error">*</span>
                        </label>
                        <InputText
                            id="call-title"
                            value={localCall.title || ''}
                            onChange={(event) =>
                                updateCall({ title: event.target.value })
                            }
                            placeholder="e.g., Annual Research Grant Call 2026"
                            className={classNames({
                                'p-invalid':
                                    submitted && !localCall.title?.trim(),
                            })}
                        />
                        {submitted && !localCall.title?.trim() && (
                            <small className="p-error block mt-1">
                                Title is required.
                            </small>
                        )}
                    </div>
                </div>

                {/* Description & Instructions */}
                <div className="formgrid grid mt-2">
                    <div className="field col-12">
                        <label htmlFor="call-description" className="font-bold block mb-2">
                            Description & Instructions
                        </label>
                        <InputTextarea
                            id="call-description"
                            value={localCall.description || ''}
                            onChange={(event) =>
                                updateCall({ description: event.target.value })
                            }
                            rows={4}
                            placeholder="Provide overview, guidelines, or instructions for applicants..."
                        />
                    </div>
                </div>
            </div>

            {/* Hidden submit button triggered by ItemManager dialog footer */}
            <button type="submit" hidden disabled={saving} />
        </form>
    );
};

export default CallForm;