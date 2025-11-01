'use client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from 'primereact/button';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
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
import { Organization, OrganizationalUnit } from '../../organizations/models/organization.model';
import { ThemeApi } from '../../themes/api/theme.api';
import { Theme } from '../../themes/models/theme.model';
import { CallApi } from '../api/call.api';
import { Call, CallStatus, validateCall } from '../models/call.model';

interface SaveDialogProps {
    visible: boolean;
    call: Call;
    onHide: () => void;
    onComplete?: (savedCall: Call) => void;
}

const SaveDialog = ({ visible, call, onHide, onComplete }: SaveDialogProps) => {
    const { getOrganizationsByType } = useAuth();
    const toast = useRef<Toast>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);

    const [localCall, setLocalCall] = useState<Call>({ ...call });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const [grants, setGrants] = useState<Grant[]>([]);
    // const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const data = getOrganizationsByType([OrganizationalUnit.Directorate]);
                setOrganizations(data);
            } catch (err) {
                console.error('Failed to fetch organizations:', err);
            }
        };
        fetchOrganizations();
    }, []);


    useEffect(() => {
        const fetchCalendars = async () => {
            try {
                const data = await CalendarApi.getCalendars({ status: CalendarStatus.active });
                setCalendars(data);
            } catch (err) {
                console.error('Failed to fetch calendars:', err);
            }
        };
        fetchCalendars();
    }, []);




    useEffect(() => {
        if (!(localCall.directorate as any)?._id) return;
        const fetchGrants = async () => {
            try {
                const data = await GrantApi.getGrants({ directorate: (localCall.directorate as any)._id });
                setGrants(data);
            } catch (err) {
                console.error('Failed to fetch grants:', err);
            }
        };
        fetchGrants();
    }, [localCall.directorate]);

    useEffect(() => {
        if (!(localCall.directorate as any)?._id) return;
        const fetchThemes = async () => {
            try {
                const data = await ThemeApi.getThemes({ directorate: (localCall.directorate as any)._id });
                setThemes(data);
            } catch (err) {
                console.error('Failed to fetch themes:', err);
            }
        };
        fetchThemes();
    }, [localCall.directorate]);


    // Save handler with API
    const save = async () => {
        try {
            setSubmitted(true);
            const validation = validateCall(localCall);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Call;
            if (localCall._id) {
                saved = await CallApi.updateCall(localCall);
            } else {
                saved = await CallApi.createCall(localCall);
            }

            saved = {
                ...saved,
                calendar: localCall.calendar,
                directorate: localCall.directorate,
                theme: localCall.theme,
                //evaluation: localCall.evaluation,
                grant: localCall.grant
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Call saved successfully',
                life: 2000,
            });

            if (onComplete) onComplete(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save call',
                detail: err.message || '' + err,
                life: 2000,
            });
        }
    };

    // Reset local copy when dialog opens
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
                header={localCall._id ? 'Edit Call' : 'New Call'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
                maximizable
            >
                <div className="p-fluid">
                    {!localCall._id &&
                        <div className="field">
                            <label htmlFor="directorate">Directorate</label>
                            <Dropdown
                                id="directorate"
                                value={localCall.directorate}
                                options={organizations}
                                optionLabel="name"
                                onChange={(e) => setLocalCall({ ...localCall, directorate: e.value })}
                                placeholder="Select Directorate"
                                className={classNames({ 'p-invalid': submitted && !localCall.directorate })}
                            />
                        </div>
                    }
                    {!(localCall._id) && (
                        <div className="field">
                            <label htmlFor="calendar">Research Calendar</label>
                            <Dropdown
                                id="calendar"
                                value={localCall.calendar}
                                options={calendars}
                                onChange={(e) => setLocalCall({ ...localCall, calendar: e.value })}
                                optionLabel="year"
                                placeholder="Select a Calendar"
                                required
                                className={classNames({ 'p-invalid': submitted && !localCall.calendar })}
                            />
                        </div>
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
                            value={localCall.description ?? ""}
                            onChange={(e) => setLocalCall({ ...localCall, description: e.target.value })}
                            rows={5}
                            cols={30}
                        />
                    </div>

                    {/**
 * <div className="field">
                        <label htmlFor="deadline">Deadline</label>
                        <PrimeCalendar
                            id="deadline"
                            value={localCall.deadline ? new Date(localCall.deadline) : undefined}
                            onChange={(e) => setLocalCall({ ...localCall, deadline: e.value! })}
                            dateFormat="yy-mm-dd"
                            showIcon
                            className={classNames({ 'p-invalid': submitted && !localCall.deadline })}
                            required
                            showTime
                            hourFormat="12"
                        />
                    </div>
 */}


                    {!localCall._id && (
                        <>
                            <div className="field">
                                <label htmlFor="grant">Grant</label>
                                <Dropdown
                                    id="grant"
                                    dataKey="_id"
                                    value={localCall.grant}
                                    options={grants}
                                    onChange={(e) => setLocalCall({ ...localCall, grant: e.value })}
                                    optionLabel="title"
                                    placeholder="Select a Grant"
                                    required
                                    className={classNames({ 'p-invalid': submitted && !localCall.grant })}
                                />
                            </div>



                            <div className="field">
                                <label htmlFor="theme">Thematic Area</label>
                                <Dropdown
                                    id="theme"
                                    value={localCall.theme}
                                    options={themes}
                                    onChange={(e) => setLocalCall({ ...localCall, theme: e.value })}
                                    optionLabel="title"
                                    placeholder="Select Theme"
                                />
                            </div>
                        </>
                    )}

                    {localCall._id && (
                        <div className="field">
                            <label htmlFor="status">Status</label>
                            <Dropdown
                                id="status"
                                value={localCall.status}
                                options={Object.values(CallStatus).map((s) => ({ label: s, value: s }))}
                                onChange={(e) => setLocalCall({ ...localCall, status: e.value })}
                                placeholder="Select Status"
                                className={classNames({ 'p-invalid': submitted && !localCall.status })}
                            />
                        </div>
                    )}

                    {errorMessage && <small className="p-error">{errorMessage}</small>}
                </div>
            </Dialog>
        </>
    );

};

export default SaveDialog;
