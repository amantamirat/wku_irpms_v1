'use client';
import { Button } from 'primereact/button';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Calendar } from '../../calendars/models/calendar.model';
import { Call, validateCall } from '../models/call.model';
import { InputTextarea } from 'primereact/inputtextarea';
import { Grant } from '../../grants/models/grant.model';

interface SaveDialogProps {
    visible: boolean;
    call: Call;
    calendars?: Calendar[];
    grants?: Grant[];
    onChange: (call: Call) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, call, calendars, grants, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const save = async () => {
        setSubmitted(true);
        const result = validateCall(call);
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
            style={{ width: '600px', minHeight: '600px' }}
            header={call._id ? 'Edit Call' : 'Create New Call'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
            maximizable
        >

            <div className="field">
                <label htmlFor="calendar">Reserach Calendar</label>
                <Dropdown
                    id="calendar"
                    value={call.calendar}
                    options={calendars}
                    onChange={(e) => onChange({ ...call, calendar: e.value })}
                    optionLabel="year"
                    placeholder="Select a Calendar"
                    required
                    className={classNames({ 'p-invalid': submitted && !call.calendar })}
                />
            </div>
            <div className="field">
                <label htmlFor="title">Title</label>
                <InputText
                    id="title"
                    value={call.title}
                    onChange={(e) => onChange({ ...call, title: e.target.value })}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !call.title })}
                />
            </div>

            <div className="field">
                <label htmlFor="description">Description </label>
                <InputTextarea
                    value={call.description ?? ""}
                    onChange={(e) => onChange({ ...call, description: e.target.value })}
                    rows={5}
                    cols={30} />
            </div>

            <div className="field">
                <label htmlFor="deadline">Deadline</label>
                <PrimeCalendar
                    id="deadline"
                    value={call.deadline ? new Date(call.deadline) : undefined}
                    onChange={(e) => onChange({ ...call, deadline: e.value! })}
                    dateFormat="yy-mm-dd"
                    showIcon
                    className={classNames({ 'p-invalid': submitted && !call.deadline })}
                    required
                />
            </div>

            <div className="field">
                <label htmlFor="grant">Grant</label>
                <Dropdown
                    id="grant"
                    value={call.grant}
                    options={grants}
                    onChange={(e) => onChange({ ...call, grant: e.value })}
                    optionLabel="title"
                    placeholder="Select a Grant"
                    required
                    className={classNames({ 'p-invalid': submitted && !call.grant })}
                />
            </div>
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
