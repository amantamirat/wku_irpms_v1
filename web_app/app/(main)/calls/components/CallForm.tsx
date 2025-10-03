'use client';
import { Button } from 'primereact/button';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';
import { Calendar, CalendarStatus } from '../../calendars/models/calendar.model';
import { Call, CallStatus, validateCall } from '../models/call.model';
import { InputTextarea } from 'primereact/inputtextarea';
import { Grant } from '../../grants/models/grant.model';
import { Theme } from '../../themes/models/theme.model';
import { Evaluation } from '../../evals/models/eval.model';
import { CalendarApi } from '../../calendars/api/calendar.api';

interface CallFormProps {
    call: Call;
    setCall: (call: Call) => void;
    calendars?: Calendar[];
    grants?: Grant[];
    themes?: Theme[];
    evaluations?: Evaluation[];
    submitted: boolean;
}

const CallForm = (props: CallFormProps) => {
    const { call, setCall, calendars, grants, themes, evaluations, submitted } = props;


    const [showCalendarDropDown] = useState(() => !call.calendar);


    return (
        <div className="p-fluid">
            {showCalendarDropDown && <>
                <div className="field">
                    <label htmlFor="calendar">Reserach Calendar</label>
                    <Dropdown
                        id="calendar"
                        value={call.calendar}
                        options={calendars}
                        onChange={(e) => {
                            setCall({ ...call, calendar: e.value });
                        }}
                        optionLabel="year"
                        placeholder="Select a Calendar"
                        required
                        className={classNames({ 'p-invalid': submitted && !call.calendar })}
                    />
                </div>
            </>
            }

            <div className="field">
                <label htmlFor="title">Title</label>
                <InputText
                    id="title"
                    value={call.title}
                    onChange={(e) => setCall({ ...call, title: e.target.value })}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !call.title })}
                />
            </div>

            <div className="field">
                <label htmlFor="description">Description </label>
                <InputTextarea
                    value={call.description ?? ""}
                    onChange={(e) => setCall({ ...call, description: e.target.value })}
                    rows={5}
                    cols={30} />
            </div>

            <div className="field">
                <label htmlFor="deadline">Deadline</label>
                <PrimeCalendar
                    id="deadline"
                    value={call.deadline ? new Date(call.deadline) : undefined}
                    onChange={(e) => setCall({ ...call, deadline: e.value! })}
                    dateFormat="yy-mm-dd"
                    showIcon
                    className={classNames({ 'p-invalid': submitted && !call.deadline })}
                    required
                    showTime
                    hourFormat="12"
                />
            </div>

            <div className="field">
                <label htmlFor="grant">Grant</label>
                <Dropdown
                    id="grant"
                    dataKey="_id"
                    value={call.grant}
                    options={grants}
                    onChange={(e) => setCall({ ...call, grant: e.value })}
                    optionLabel="title"
                    placeholder="Select a Grant"
                    required
                    className={classNames({ 'p-invalid': submitted && !call.grant })}
                />
            </div>

            <div className="field">
                <label htmlFor="evaluation">Evaluation</label>
                <Dropdown
                    id="evaluation"
                    value={call.evaluation}
                    options={evaluations}
                    onChange={(e) =>
                        setCall({
                            ...call,
                            evaluation: e.value,
                        })
                    }
                    optionLabel="title"
                    placeholder="Select Evaluation"
                    required
                    className={classNames({ 'p-invalid': submitted && !call.evaluation })}
                />
            </div>



            <div className="field">
                <label htmlFor="theme">Theme</label>
                <Dropdown
                    id="theme"
                    value={call.theme}
                    options={themes}
                    onChange={(e) =>
                        setCall({
                            ...call,
                            theme: e.value,
                        })
                    }
                    optionLabel="title"
                    placeholder="Select Theme"
                />
            </div>
            {call._id && <>
                <div className="field">
                    <label htmlFor="status">Status</label>
                    <Dropdown
                        id="status"
                        value={call.status}
                        options={Object.values(CallStatus).map(s => ({ label: s, value: s }))}
                        onChange={(e) =>
                            setCall({ ...call, status: e.value })
                        }
                        placeholder="Select Status"
                        className={classNames({ 'p-invalid': submitted && !call.status })}
                    />
                </div>
            </>
            }

        </div>

    );
}

export default CallForm;
