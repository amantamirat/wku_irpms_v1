'use client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { CalendarApi } from '../../calendars/api/calendar.api';
import { Calendar } from '../../calendars/models/calendar.model';
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';
import { Organization, OrgnUnit } from '../../organizations/models/organization.model';
import { ThemeApi } from '../../thematics/themes/api/theme.api';
import { Theme } from '../../thematics/themes/models/theme.model';
import { CallApi } from '../api/call.api';
import { Call, CallStatus, validateCall } from '../models/call.model';
import { ThematicApi } from '../../thematics/api/thematic.api';

interface SaveCallProps {
    visible: boolean;
    call: Call;
    onHide: () => void;
    onComplete?: (saved: Call) => void;
}

const SaveCall = ({ visible, call, onHide, onComplete }: SaveCallProps) => {
    const toast = useRef<Toast>(null);
    const { getOrganizationsByType } = useAuth();

    const [localCycle, setLocalCycle] = useState<Call>({ ...call });
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [themes, setThemes] = useState<Theme[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    // Load active calendars
    useEffect(() => {
        const loadCalendars = async () => {
            try {
                //filter by status??
                const data = await CalendarApi.getCalendars();
                setCalendars(data);
            } catch (err) {
                console.error('Failed to load calendars:', err);
            }
        };
        loadCalendars();
    }, []);

    // Load organizations
    useEffect(() => {
        const data = getOrganizationsByType([OrgnUnit.Directorate]);
        setOrganizations(data);
    }, []);

    // Load grants
    useEffect(() => {
        const loadGrants = async () => {
            try {
                const data = await GrantApi.getGrants({ directorate: localCycle.directorate });
                setGrants(data);
            } catch (err) {
                console.error('Failed to load grants:', err);
            }
        };

        const loadThematics = async () => {
            try {
                const data = await ThematicApi.getThematics({ directorate: localCycle.directorate });
                setThemes(data);
            } catch (err) {
                console.error('Failed to load themes:', err);
            }
        };

        loadGrants();
        loadThematics();
    }, [localCycle]);



    // Save handler
    const save = async () => {
        try {
            setSubmitted(true);
            const validation = validateCall(localCycle);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Call;
            if (localCycle._id) saved = await CallApi.update(localCycle);
            else saved = await CallApi.create(localCycle);

            saved = {
                ...saved,
                calendar: localCycle.calendar,
                directorate: localCycle.directorate,
                thematic: localCycle.thematic,
                grant: localCycle.grant
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
            setLocalCycle({ ...call });
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
                header={localCycle._id ? `Edit Call` : `New Call`}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
                maximizable
            >
                <div className="p-fluid">
                    {!localCycle._id && (
                        <>
                            <div className="field">
                                <label htmlFor="calendar">Calendar</label>
                                <Dropdown
                                    id="calendar"
                                    value={localCycle.calendar}
                                    options={calendars}
                                    optionLabel="year"
                                    onChange={(e) => setLocalCycle({ ...localCycle, calendar: e.value })}
                                    placeholder="Select Calendar"
                                    className={classNames({ 'p-invalid': submitted && !localCycle.calendar })}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="organization">
                                    Directorate
                                </label>
                                <Dropdown
                                    id="organization"
                                    value={localCycle.directorate}
                                    options={organizations}
                                    optionLabel="name"
                                    onChange={(e) => setLocalCycle({ ...localCycle, directorate: e.value })}
                                    placeholder={`Select 'Directorate'`}
                                    className={classNames({ 'p-invalid': submitted && !localCycle.directorate })}
                                />
                            </div>
                        </>
                    )}

                    <div className="field">
                        <label htmlFor="title">Title</label>
                        <InputText
                            id="title"
                            value={localCycle.title}
                            onChange={(e) => setLocalCycle({ ...localCycle, title: e.target.value })}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !localCycle.title })}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="description">Description</label>
                        <InputTextarea
                            id="description"
                            value={localCycle.description ?? ''}
                            onChange={(e) => setLocalCycle({ ...localCycle, description: e.target.value })}
                            rows={5}
                            cols={30}
                        />
                    </div>

                    {!localCycle._id && (
                        <>
                            <div className="field">
                                <label htmlFor="grant">Grant</label>
                                <Dropdown
                                    id="grant"
                                    dataKey="_id"
                                    value={localCycle.grant}
                                    options={grants}
                                    optionLabel="title"
                                    onChange={(e) => setLocalCycle({ ...localCycle, grant: e.value })}
                                    placeholder="Select Grant"
                                    className={classNames({ 'p-invalid': submitted && !localCycle.grant })}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="theme">Thematic Area</label>
                                <Dropdown
                                    id="theme"
                                    dataKey="_id"
                                    value={localCycle.thematic}
                                    options={themes}
                                    optionLabel="title"
                                    onChange={(e) => setLocalCycle({ ...localCycle, thematic: e.value })}
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
