'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { CalendarApi } from '../../calendars/api/calendar.api';
import { Calendar, CalendarStatus } from '../../calendars/models/calendar.model';
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';
import { Organization, OrgnUnit } from '../../organizations/models/organization.model';
import { ThematicApi } from '../../thematics/api/thematic.api';
import { Thematic } from '../../thematics/models/thematic.model';
import { CallApi } from '../api/call.api';
import { Call, validateCall } from '../models/call.model';
import { OrganizationApi } from '../../organizations/api/organization.api';

interface SaveCallProps {
    visible: boolean;
    call: Call;
    calendarProvided: boolean;
    directorateProvided: boolean;
    onHide: () => void;
    onComplete?: (saved: Call) => void;
}

const SaveCall = ({ visible, call, calendarProvided, directorateProvided, onHide, onComplete }: SaveCallProps) => {
    const toast = useRef<Toast>(null);

    const [localCall, setLocalCall] = useState<Call>({ ...call });
    const [calendars, setCalendars] = useState<Calendar[] | undefined>(undefined);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [themes, setThemes] = useState<Thematic[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    // Load active calendars
    useEffect(() => {
        if (calendarProvided) {
            return
        }
        const loadCalendars = async () => {
            try {
                const data = await CalendarApi.getAll({ status: CalendarStatus.active });
                setCalendars(data);
            } catch (err) {
                console.error('Failed to load calendars:', err);
            }
        };
        loadCalendars();
    }, [calendarProvided]);


    useEffect(() => {
        if (directorateProvided) {
            return
        }
        const loadDirectorates = async () => {
            try {
                const data = await OrganizationApi.getAll({ type: OrgnUnit.directorate });
                setOrganizations(data);
            } catch (err) {
                console.error('Failed to load directorates:', err);
            }
        };
        loadDirectorates();
    }, [directorateProvided]);


    // Load grants
    useEffect(() => {
        const loadGrants = async () => {
            try {
                const data = await GrantApi.getAll();
                setGrants(data);
            } catch (err) {
                console.error('Failed to load grants:', err);
            }
        };

        const loadThematics = async () => {
            try {
                const data = await ThematicApi.getAll({ directorate: localCall.directorate });
                setThemes(data);
            } catch (err) {
                console.error('Failed to load themes:', err);
            }
        };

        loadGrants();
        loadThematics();
    }, [localCall]);



    // Save handler
    const save = async () => {
        try {
            setSubmitted(true);
            const validation = validateCall(localCall);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Call;
            if (localCall._id) saved = await CallApi.update(localCall);
            else saved = await CallApi.create(localCall);

            saved = {
                ...saved,
                calendar: localCall.calendar,
                directorate: localCall.directorate,
                thematic: localCall.thematic,
                grant: localCall.grant
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: `Saved successfully`,
                life: 2000,
            });

            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: `Failed to save`,
                detail: err.message || String(err),
                life: 2000,
            });
        }
    };

    // Reset form when visible
    useEffect(() => {
        if (visible) {
            setLocalCall({ ...call });
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible, call]);

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

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localCall._id ? `Edit Call` : `New Call`}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
                maximizable
            >
                <div className="p-fluid">
                    {!localCall._id && (
                        <>
                            {
                                !calendarProvided &&
                                <div className="field">
                                    <label htmlFor="calendar">Calendar</label>
                                    <Dropdown
                                        id="calendar"
                                        value={localCall.calendar}
                                        options={calendars}
                                        optionLabel="year"
                                        onChange={(e) => setLocalCall({ ...localCall, calendar: e.value })}
                                        placeholder="Select Calendar"
                                        className={classNames({ 'p-invalid': submitted && !localCall.calendar })}
                                    />
                                </div>
                            }
                            {
                                !directorateProvided &&

                                <div className="field">
                                    <label htmlFor="organization">
                                        Directorate
                                    </label>
                                    <Dropdown
                                        id="organization"
                                        value={localCall.directorate}
                                        options={organizations}
                                        optionLabel="name"
                                        onChange={(e) => setLocalCall({ ...localCall, directorate: e.value })}
                                        placeholder={'Select Directorate'}
                                        className={classNames({ 'p-invalid': submitted && !localCall.directorate })}
                                    />
                                </div>
                            }
                        </>
                    )}

                    <div className="field">
                        <label htmlFor="title">Title</label>
                        <InputText
                            id="title"
                            value={localCall.title}
                            onChange={(e) => setLocalCall({ ...localCall, title: e.target.value })}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !localCall.title })}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="description">Description</label>
                        <InputTextarea
                            id="description"
                            value={localCall.description ?? ''}
                            onChange={(e) => setLocalCall({ ...localCall, description: e.target.value })}
                            rows={5}
                            cols={30}
                        />
                    </div>

                    {!localCall._id && (
                        <>
                            <div className="field">
                                <label htmlFor="grant">Grant</label>
                                <Dropdown
                                    id="grant"
                                    dataKey="_id"
                                    value={localCall.grant}
                                    options={grants}
                                    optionLabel="title"
                                    onChange={(e) => setLocalCall({ ...localCall, grant: e.value })}
                                    placeholder="Select Grant"
                                    className={classNames({ 'p-invalid': submitted && !localCall.grant })}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="theme">Thematic Area</label>
                                <Dropdown
                                    id="theme"
                                    dataKey="_id"
                                    value={localCall.thematic}
                                    options={themes}
                                    optionLabel="title"
                                    onChange={(e) => setLocalCall({ ...localCall, thematic: e.value })}
                                    placeholder="Select Theme"
                                />
                            </div>
                        </>
                    )}

                    {errorMessage && <small className="p-error">{errorMessage}</small>}
                </div>
            </Dialog>
        </>
    );
};

export default SaveCall;
