'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';
import { Call, validateCall } from '../models/call.model';
import { Calendar } from '../../calendars/models/calendar.model';



interface SaveDialogProps {
    visible: boolean;
    call: Call;
    calendars?: Calendar[];
    onChange: (call: Call) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, call, calendars, onChange, onSave, onHide } = props;
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
            style={{ width: '500px' }}
            header={call._id ? 'Edit Call' : 'Create New Call'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >

            <div className="field">
                <label htmlFor="calendar">Reserach Calendar</label>
                <Dropdown
                    id="calendar"
                    value={call.calendar}
                    options={calendars}
                    onChange={(e) =>
                        onChange({
                            ...call,
                            calendar: e.value,
                        })
                    }
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
                <label htmlFor="dead_line">Dead Line</label>
                <PrimeCalendar
                    id="dead_line"
                    value={call.dead_line ? new Date(call.dead_line) : undefined}
                    onChange={(e) => onChange({ ...call, dead_line: e.value! })}
                    dateFormat="yy-mm-dd"
                    showIcon
                    className={classNames({ 'p-invalid': submitted && !call.dead_line })}
                    required
                />
            </div>


            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
