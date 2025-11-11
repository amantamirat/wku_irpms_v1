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
import { Calendar, CalendarStatus } from '../../calendars/models/calendar.model';
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';
import { ThemeApi } from '../../thematic_areas/api/theme.api';
import { Theme } from '../../thematic_areas/models/theme.model';
import { Organization, OrganizationalUnit } from '../../organizations/models/organization.model';
import { Cycle, CycleStatus, validateCycle } from '../models/cycle.model';
import { CycleType } from '../models/cycle.model';
import { CycleApi } from '../api/cycle.api';

interface SaveCycleProps {
    type: CycleType;
    visible: boolean;
    cycle: Cycle;
    onHide: () => void;
    onComplete?: (saved: Cycle) => void;
}

const SaveCycle = ({ type, visible, cycle, onHide, onComplete }: SaveCycleProps) => {
    const toast = useRef<Toast>(null);
    const { getOrganizationsByType } = useAuth();

    const [localCycle, setLocalCycle] = useState<Cycle>({ ...cycle });
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
                const data = await CalendarApi.getCalendars({ status: CalendarStatus.active });
                setCalendars(data);
            } catch (err) {
                console.error('Failed to load calendars:', err);
            }
        };
        loadCalendars();
    }, []);

    // Load organizations
    useEffect(() => {
        const orgType = type === 'Program' ? [OrganizationalUnit.Center] : [OrganizationalUnit.Directorate];
        const data = getOrganizationsByType(orgType);
        setOrganizations(data);
    }, [type, getOrganizationsByType]);

    // Load grants
    useEffect(() => {
        const loadGrants = async () => {
            try {
                if (!localCycle.organization) return;

                let directorateId: string | undefined;
                if (type === 'Program') {
                    const org = localCycle.organization as any;
                    directorateId = org?.parent;
                } else {
                    directorateId = (localCycle.organization as any)?._id;
                }

                if (!directorateId) return;

                const data = await GrantApi.getGrants({ directorate: directorateId });
                setGrants(data);
            } catch (err) {
                console.error('Failed to load grants:', err);
            }
        };

        loadGrants();
    }, [localCycle.organization, type]);

    // Load themes
    useEffect(() => {
        const loadThemes = async () => {
            try {
                if (!localCycle.organization) return;

                let directorateId: string | undefined;
                if (type === 'Program') {
                    const org = localCycle.organization as any;
                    directorateId = org?.parent;
                } else {
                    directorateId = (localCycle.organization as any)?._id;
                }

                if (!directorateId) return;

                const data = await ThemeApi.getThemes({ directorate: directorateId });
                setThemes(data);
            } catch (err) {
                console.error('Failed to load themes:', err);
            }
        };

        loadThemes();
    }, [localCycle.organization, type]);

    // Save handler
    const save = async () => {
        try {
            setSubmitted(true);
            const validation = validateCycle(localCycle);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Cycle;
            if (localCycle._id) saved = await CycleApi.updateCycle(localCycle);
            else saved = await CycleApi.createCycle(localCycle);

            saved = {
                ...saved,
                calendar: localCycle.calendar,
                organization: localCycle.organization,
                theme: localCycle.theme,
                //evaluation: localCall.evaluation,
                grant: localCycle.grant
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: `${type} saved successfully`,
                life: 2000,
            });

            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: `Failed to save ${type}`,
                detail: err.message || String(err),
                life: 2000,
            });
        }
    };

    // Reset form when visible
    useEffect(() => {
        if (visible) {
            setLocalCycle({ ...cycle });
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible, cycle]);

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
                header={localCycle._id ? `Edit ${type}` : `New ${type}`}
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
                                    {type === 'Program' ? 'Center' : 'Directorate'}
                                </label>
                                <Dropdown
                                    id="organization"
                                    value={localCycle.organization}
                                    options={organizations}
                                    optionLabel="name"
                                    onChange={(e) => setLocalCycle({ ...localCycle, organization: e.value })}
                                    placeholder={`Select ${type === 'Program' ? 'Center' : 'Directorate'}`}
                                    className={classNames({ 'p-invalid': submitted && !localCycle.organization })}
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
                                    value={localCycle.theme}
                                    options={themes}
                                    optionLabel="title"
                                    onChange={(e) => setLocalCycle({ ...localCycle, theme: e.value })}
                                    placeholder="Select Theme"
                                />
                            </div>
                        </>
                    )}

                    {localCycle._id && (
                        <div className="field">
                            <label htmlFor="status">Status</label>
                            <Dropdown
                                id="status"
                                value={localCycle.status}
                                options={Object.values(CycleStatus).map((s) => ({ label: s, value: s }))}
                                onChange={(e) => setLocalCycle({ ...localCycle, status: e.value })}
                                placeholder="Select Status"
                                className={classNames({ 'p-invalid': submitted && !localCycle.status })}
                            />
                        </div>
                    )}

                    {errorMessage && <small className="p-error">{errorMessage}</small>}
                </div>
            </Dialog>
        </>
    );
};

export default SaveCycle;
