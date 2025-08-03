'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import { Calendar, validateCalendar } from '@/models/calendar';
import { InputNumber } from 'primereact/inputnumber';

interface SaveDialogProps {
    visible: boolean;
    calendar: Calendar;
    onChange: (calendar: Calendar) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, calendar, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const save = async () => {
        setSubmitted(true);
        const result = validateCalendar(calendar);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        setErrorMessage(undefined);
        onSave();
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);

    return (
        <Dialog
            visible={visible}
            style={{ width: '500px' }}
            header={calendar._id ? 'Edit Academic Calendar' : 'New Academic Calendar'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            <div className="field">
                <label htmlFor="year">Year</label>
                <InputNumber
                    id="year"
                    value={calendar.year}
                    onChange={(e) => onChange({ ...calendar, year: e.value ?? 0 })}
                    mode="decimal" // Basic number mode
                    useGrouping={false} // No thousand separator
                    showButtons
                    required
                    className={classNames({ 'p-invalid': submitted && !calendar.year })}
                />
            </div>

            <div className="field">
                <label htmlFor="start_date">Start Date</label>
                <PrimeCalendar
                    id="start_date"                    
                    value={calendar.start_date ? new Date(calendar.start_date) : undefined}
                    onChange={(e) => onChange({ ...calendar, start_date: e.value || null })}
                    dateFormat="yy-mm-dd"
                    showIcon
                    className={classNames({ 'p-invalid': submitted && !calendar.start_date })}
                />
            </div>

            <div className="field">
                <label htmlFor="end_date">End Date</label>
                <PrimeCalendar
                    id="end_date"                   
                    value={calendar.end_date ? new Date(calendar.end_date) : undefined}
                    onChange={(e) => onChange({ ...calendar, end_date: e.value || null })}
                    dateFormat="yy-mm-dd"
                    showIcon
                    className={classNames({ 'p-invalid': submitted && !calendar.end_date })}
                />
            </div>

            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
