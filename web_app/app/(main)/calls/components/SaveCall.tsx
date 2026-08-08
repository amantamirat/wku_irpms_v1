'use client';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

// API & Models
import { CalendarApi } from '../../calendars/api/calendar.api';
import { Calendar, CalendarStatus } from '../../calendars/models/calendar.model';
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';
import { GrantStatus } from '../../grants/models/grant.state-machine';
import { CallApi } from '../api/call.api';
import { Call, sanitizeCall, validateCall } from '../models/call.model';

// Constraint & Composition imports (adjust paths to match your project structure)
import { ConstraintApi } from '../../constraints/api/constraint.api';
import { Constraint } from '../../constraints/models/constraint.model';
import { CompositionApi } from '../../compositions/api/composition.api';
import { Composition } from '../../compositions/models/composition.model';

const SaveCall = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Call>) => {
    const toast = useRef<Toast>(null);
    const [localCall, setLocalCall] = useState<Call>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    // Resource options states
    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [compositions, setCompositions] = useState<Composition[]>([]); // Added compositions state

    const isGrantPredefined = !!item.grant;
    const isCalendarPredefined = !!item.calendar;

    // Helper to extract string ID from potentially populated objects
    const getTargetId = (target: any): string | undefined => {
        if (!target) return undefined;
        return typeof target === 'object' ? target._id : target;
    };

    // Keep state in sync with initial item prop
    useEffect(() => {
        setLocalCall({ ...item });
    }, [item]);

    // 1. Load dynamic options for Calendars, Grants, Constraints, and Compositions
    useEffect(() => {
        if (!visible) return;

        const loadDropdownData = async () => {
            try {
                const [availableGrants, availableCalendars, availableConstraints, availableCompositions] = await Promise.all([
                    !isGrantPredefined
                        ? GrantApi.getAll({ status: GrantStatus.active, populate: true })
                        : Promise.resolve([]),
                    !isCalendarPredefined
                        ? CalendarApi.getAll({ status: CalendarStatus.active })
                        : Promise.resolve([]),
                    ConstraintApi.getAll(),
                    CompositionApi.getAll() // Fetches composition options
                ]);

                if (availableGrants.length) setGrants(availableGrants);
                if (availableCalendars.length) setCalendars(availableCalendars);
                if (availableConstraints.length) setConstraints(availableConstraints);
                if (availableCompositions.length) setCompositions(availableCompositions);

                setLocalCall(prev => ({
                    ...prev,
                    grant: !prev.grant && availableGrants.length === 1 ? availableGrants[0] : prev.grant,
                    calendar: !prev.calendar && availableCalendars.length === 1 ? availableCalendars[0] : prev.calendar
                }));

            } catch (err) {
                console.error('Failed to load strategic setup dependencies:', err);
            }
        };

        loadDropdownData();
    }, [visible, isGrantPredefined, isCalendarPredefined]);

    const clearForm = () => {
        setSubmitted(false);
    };

    const saveCall = async () => {
        try {
            setSubmitted(true);

            const validation = validateCall(localCall);
            if (!validation.valid) throw new Error(validation.message);

            const payload = sanitizeCall(localCall);
            let saved: Call;

            if (localCall._id) saved = await CallApi.update(payload);
            else saved = await CallApi.create(payload as Call);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Call saved successfully',
                life: 2000,
            });

            onComplete?.({
                ...saved,
                grant: localCall.grant,
                calendar: localCall.calendar
            });
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Call',
                life: 3000,
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
            <Button label="Save" icon="pi pi-check" onClick={saveCall} severity="success" />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localCall._id ? 'Edit Call' : 'New Strategic Call'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                <div className="grid formgrid">
                    {/* Calendar Dropdown */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="calendar" className="font-bold">Operational Year</label>
                        {isCalendarPredefined ? (
                            <InputText
                                value={typeof localCall.calendar === 'object' ? String((localCall.calendar as any)?.year || '') : String(localCall.calendar || '')}
                                disabled
                                className="surface-100"
                            />
                        ) : (
                            <Dropdown
                                id="calendar"
                                value={localCall.calendar}
                                options={calendars}
                                optionLabel="year"
                                dataKey="_id"
                                onChange={(e) => setLocalCall({ ...localCall, calendar: e.value })}
                                placeholder="Select Year"
                                className={classNames({ 'p-invalid': submitted && !localCall.calendar })}
                            />
                        )}
                    </div>

                    {/* Grant Dropdown */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="grant" className="font-bold">Grant Source</label>
                        {isGrantPredefined ? (
                            <InputText
                                value={(localCall.grant as Grant).title}
                                disabled
                                className="surface-100"
                            />
                        ) : (
                            <Dropdown
                                id="grant"
                                value={localCall.grant}
                                options={grants}
                                optionLabel="title"
                                dataKey="_id"
                                onChange={(e) => setLocalCall({ ...localCall, grant: e.value })}
                                placeholder="Select Grant"
                                className={classNames({ 'p-invalid': submitted && !localCall.grant })}
                            />
                        )}
                    </div>
                </div>

                {/* Call Title */}
                <div className="field">
                    <label htmlFor="title" className="font-bold">Call Title</label>
                    <InputText
                        id="title"
                        value={localCall.title || ''}
                        onChange={(e) => setLocalCall({ ...localCall, title: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localCall.title })}
                    />
                </div>

                {/* Constraint & Composition Side-by-Side Grid */}
                <div className="grid formgrid">
                    {/* Constraint Dropdown */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="constraint" className="font-semibold block mb-2">Constraint</label>
                        <Dropdown
                            id="constraint"
                            value={getTargetId(localCall.constraint)}
                            options={constraints}
                            optionLabel="name"
                            optionValue="_id"
                            onChange={(e) => setLocalCall({ ...localCall, constraint: e.value })}
                            placeholder="Select Constraint"
                            showClear
                        />
                    </div>

                    {/* Composition Dropdown */}
                    <div className="field col-12 md:col-6">
                        <label htmlFor="composition" className="font-semibold block mb-2">Composition</label>
                        <Dropdown
                            id="composition"
                            value={getTargetId(localCall.composition)}
                            options={compositions}
                            optionLabel="name"
                            optionValue="_id"
                            onChange={(e) => setLocalCall({ ...localCall, composition: e.value })}
                            placeholder="Select Composition"
                            showClear
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="field">
                    <label htmlFor="description" className="font-bold">Description / Instructions</label>
                    <InputTextarea
                        id="description"
                        value={localCall.description ?? ''}
                        onChange={(e) => setLocalCall({ ...localCall, description: e.target.value })}
                        rows={4}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveCall;