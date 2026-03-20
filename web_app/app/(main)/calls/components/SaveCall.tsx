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

import { CallApi } from '../api/call.api';
import { Call, validateCall } from '../models/call.model';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { GrantStatus } from '../../grants/models/grant.state-machine';

const SaveCall = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Call>) => {

    const toast = useRef<Toast>(null);

    const [localCall, setLocalCall] = useState<Call>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    const [calendars, setCalendars] = useState<Calendar[] | undefined>(undefined);
    const [grants, setGrants] = useState<Grant[] | undefined>(undefined);


    const isGrantPredefined = !!item.grant;
    const isCalendarPredefined = !!item.calendar;

    // ---------------------------
    // Load Calendars
    // ---------------------------
    useEffect(() => {
        if (isCalendarPredefined) return
        const loadCalendars = async () => {
            try {
                const data = await CalendarApi.getAll({ status: CalendarStatus.active });
                setCalendars(data);
            } catch (err) {
                console.error('Failed to load calendars:', err);
            }
        };
        loadCalendars();
    }, [isCalendarPredefined]);

    // ---------------------------
    // Load Grants
    // ---------------------------
    useEffect(() => {
        if (isGrantPredefined) return
        const loadGrants = async () => {
            try {
                const data = await GrantApi.getAll({ status: GrantStatus.active });
                setGrants(data);
            } catch (err) {
                console.error('Failed to load grants:', err);
            }
        };
        loadGrants();
    }, [isGrantPredefined]);

    // ---------------------------
    // Sync item
    // ---------------------------
    useEffect(() => {
        setLocalCall({ ...item });
    }, [item]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalCall({ ...item });
    };

    // ---------------------------
    // Save
    // ---------------------------
    const saveCall = async () => {
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
                grant: localCall.grant
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Call saved successfully',
                life: 2000,
            });

            onComplete?.(saved);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Call',
                life: 2000,
            });
        }
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveCall} />
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
            >

                {/* Calendar */}
                {!localCall._id && (
                    <div className="field">
                        <label htmlFor="calendar">Calendar</label>

                        {isCalendarPredefined ? (
                            <InputText
                                value={(localCall.calendar as Calendar)?.year + ''}
                                disabled
                            />
                        ) : (
                            <Dropdown
                                id="calendar"
                                value={localCall.calendar}
                                options={calendars}
                                optionLabel="year"
                                onChange={(e) => setLocalCall({ ...localCall, calendar: e.value })}
                                placeholder="Select Calendar"
                                className={classNames({ 'p-invalid': submitted && !localCall.calendar })}
                            />
                        )}
                    </div>
                )}

                {/* Grant */}
                {!localCall._id && (
                    <div className="field">
                        <label htmlFor="grant">Grant</label>

                        {isGrantPredefined ? (
                            <InputText
                                value={(localCall.grant as Grant)?.title}
                                disabled
                            />
                        ) : (
                            <Dropdown
                                id="grant"
                                value={localCall.grant}
                                dataKey="_id"
                                options={grants}
                                optionLabel="title"
                                onChange={(e) => setLocalCall({ ...localCall, grant: e.value })}
                                placeholder="Select Grant"
                                className={classNames({ 'p-invalid': submitted && !localCall.grant })}
                            />
                        )}
                    </div>
                )}

                {/* Title */}
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

                {/* Description */}
                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        value={localCall.description ?? ''}
                        onChange={(e) => setLocalCall({ ...localCall, description: e.target.value })}
                        rows={5}
                    />
                </div>



            </Dialog>
        </>
    );
};

export default SaveCall;