'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { Calendar, CalendarStatus, validateCalendar } from '../models/calendar.model';
import { CalendarApi } from '../api/calendar.api';

interface SaveCalendarDialogProps {
    visible: boolean;
    calendar: Calendar;
    onHide: () => void;
    onComplete?: (savedCalendar: Calendar) => void;
}

const SaveCalendarDialog = ({ visible, calendar, onHide, onComplete }: SaveCalendarDialogProps) => {
    const toast = useRef<Toast>(null);
    const [localCalendar, setLocalCalendar] = useState<Calendar>({ ...calendar });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
        setLocalCalendar({ ...calendar });
    }, [calendar]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalCalendar({ ...calendar });
    };

    const saveCalendar = async () => {
        try {
            setSubmitted(true);
            const validation = validateCalendar(localCalendar);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Calendar;
            if (localCalendar._id) {
                saved = await CalendarApi.updateCalendar(localCalendar);
            } else {
                saved = await CalendarApi.createCalendar(localCalendar);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Calendar saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save calendar',
                detail: err.message || 'Error occurred',
                life: 3000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveCalendar} />
        </>
    );

    const isEdit = !!localCalendar._id;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={isEdit ? 'Edit Academic Calendar' : 'New Academic Calendar'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field">
                    <label htmlFor="year">Year</label>
                    <InputNumber
                        id="year"
                        value={localCalendar.year}
                        onChange={(e) => setLocalCalendar({ ...localCalendar, year: e.value ?? 0 })}
                        mode="decimal"
                        useGrouping={false}
                        showButtons
                        required
                        className={classNames({ 'p-invalid': submitted && !localCalendar.year })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="start_date">Start Date</label>
                    <PrimeCalendar
                        id="start_date"
                        value={localCalendar.start_date ? new Date(localCalendar.start_date) : undefined}
                        onChange={(e) => setLocalCalendar({ ...localCalendar, start_date: e.value || null })}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className={classNames({ 'p-invalid': submitted && !localCalendar.start_date })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="end_date">End Date</label>
                    <PrimeCalendar
                        id="end_date"
                        value={localCalendar.end_date ? new Date(localCalendar.end_date) : undefined}
                        onChange={(e) => setLocalCalendar({ ...localCalendar, end_date: e.value || null })}
                        dateFormat="yy-mm-dd"
                        showIcon
                        className={classNames({ 'p-invalid': submitted && !localCalendar.end_date })}
                    />
                </div>

                {isEdit && (
                    <div className="field">
                        <label htmlFor="status">Status</label>
                        <Dropdown
                            id="status"
                            value={localCalendar.status}
                            options={Object.values(CalendarStatus).map((s) => ({ label: s, value: s }))}
                            onChange={(e) => setLocalCalendar({ ...localCalendar, status: e.value })}
                            placeholder="Select Status"
                        />
                    </div>
                )}

                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
};

export default SaveCalendarDialog;
