'use client';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar as PrimeCalendar } from 'primereact/calendar'; // Imported Calendar for date selection
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

// API & Models
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';
import { CalendarApi } from '../../calendars/api/calendar.api';
import { Calendar, CalendarStatus } from '../../calendars/models/calendar.model';
import { CallApi } from '../api/call.api';
import { Call, sanitizeCall, validateCall, CallDeadline } from '../models/call.model';
import { GrantStatus } from '../../grants/models/grant.state-machine';
import { GrantStage, StageCategory } from '../../grants/stages/models/grant.stage.model';
import { GrantStageApi } from '../../grants/stages/api/grant.stage.api';


// Extend local state type to keep track of stage names for rendering
interface LocalDeadline extends CallDeadline {
    stageName: string;
}

const SaveCall = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Call>) => {
    const toast = useRef<Toast>(null);
    const [localCall, setLocalCall] = useState<Call>({ ...item, deadlines: item.deadlines || [] });
    const [submitted, setSubmitted] = useState(false);

    // Resource options states
    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);

    // Tracks the current selection stages with their respective deadlines
    const [formDeadlines, setFormDeadlines] = useState<LocalDeadline[]>([]);

    const isGrantPredefined = !!item.grant;
    const isCalendarPredefined = !!item.calendar;

    // 1. Load dynamic options for Calendars and Grants
    useEffect(() => {
        if (!visible) return;

        const loadDropdownData = async () => {
            try {
                const [availableGrants, availableCalendars] = await Promise.all([
                    !isGrantPredefined
                        ? GrantApi.getAll({ status: GrantStatus.active, populate: true })
                        : Promise.resolve([]),
                    !isCalendarPredefined
                        ? CalendarApi.getAll({ status: CalendarStatus.active })
                        : Promise.resolve([])
                ]);

                if (availableGrants.length) setGrants(availableGrants);
                if (availableCalendars.length) setCalendars(availableCalendars);

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

    // 2. Fetch Grant Stages whenever the selected Grant changes
    useEffect(() => {
        if (!visible) return;

        const fetchStagesAndSyncDeadlines = async () => {
            const currentGrant = localCall.grant;
            const grantId = typeof currentGrant === 'object' ? currentGrant?._id : currentGrant;

            if (!grantId) {
                setFormDeadlines([]);
                return;
            }

            try {
                // Fetch selection stages for this grant
                const stages: GrantStage[] = await GrantStageApi.getAll({
                    grant: grantId,
                    category: StageCategory.selection
                });

                // Sort by order to keep the timeline chronological
                const sortedStages = stages.sort((a, b) => a.order! - b.order!);

                // Map stages into deadline forms. If editing, preserve existing values by index matching.
                const mappedDeadlines: LocalDeadline[] = sortedStages.map((stage, idx) => {
                    const existingDeadline = localCall.deadlines?.[idx];
                    return {
                        stageName: stage.name,
                        submission: existingDeadline?.submission ? new Date(existingDeadline.submission) : null as any,
                        evaluation: existingDeadline?.evaluation ? new Date(existingDeadline.evaluation) : null as any,
                    };
                });

                setFormDeadlines(mappedDeadlines);
            } catch (err) {
                console.error('Failed to load grant selection stages:', err);
            }
        };

        fetchStagesAndSyncDeadlines();
    }, [localCall.grant, visible]);

    useEffect(() => {
        setLocalCall({ ...item, deadlines: item.deadlines || [] });
    }, [item]);

    // Handle single date mutation inside the array
    const handleDeadlineChange = (index: number, field: 'submission' | 'evaluation', value: Date | null) => {
        const updated = [...formDeadlines];
        updated[index] = { ...updated[index], [field]: value || (null as any) };
        setFormDeadlines(updated);

        // Sync back to localCall object
        setLocalCall(prev => ({
            ...prev,
            deadlines: updated.map(({ submission, evaluation }) => ({ submission, evaluation }))
        }));
    };

    const clearForm = () => {
        setSubmitted(false);
        setFormDeadlines([]);
        setLocalCall({ ...item, deadlines: item.deadlines || [] });
    };

    const saveCall = async () => {
        try {
            setSubmitted(true);

            const validation = validateCall(localCall);
            if (!validation.valid) throw new Error(validation.message);

            if (localCall.budget === undefined || localCall.budget === null || localCall.budget <= 0) {
                throw new Error("Please provide a valid funding budget amount greater than 0.");
            }

            // Validate that all deadlines are filled and chronologically sound
            for (let i = 0; i < formDeadlines.length; i++) {
                const item = formDeadlines[i];
                if (!item.submission || !item.evaluation) {
                    throw new Error(`Please fill out both submission and evaluation deadlines for stage: "${item.stageName}"`);
                }
                if (new Date(item.submission) >= new Date(item.evaluation)) {
                    throw new Error(`In "${item.stageName}", submission deadline must be earlier than the evaluation deadline.`);
                }
            }

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
                style={{ width: '600px' }} // Increased width slightly to fit twin date pickers beautifully
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

                {/* Budget Allocation */}
                <div className="field">
                    <label htmlFor="budget" className="font-bold">Allocated Budget</label>
                    <InputNumber
                        id="budget"
                        value={localCall.budget ?? null}
                        onValueChange={(e) => setLocalCall({ ...localCall, budget: e.value ?? 0 })}
                        mode="currency"
                        currency="ETB"
                        locale="en-US"
                        min={0}
                        maxFractionDigits={0}
                        placeholder="Enter strategic pool limit"
                        className={classNames({ 'p-invalid': submitted && (!localCall.budget || localCall.budget <= 0) })}
                    />
                    {submitted && (!localCall.budget || localCall.budget <= 0) && (
                        <small className="p-error font-semibold block mt-1">A valid operational budget is required.</small>
                    )}
                </div>

                {/* Dynamic Selection Stage Deadlines Section */}
                {formDeadlines.length > 0 && (
                    <div className="field mt-4">
                        {/* Changed h4 to a clean, uppercase label style */}
                        <div className="text-sm font-bold uppercase tracking-wider text-600 border-bottom-1 surface-border pb-2 mb-3">
                            Required Stage Deadlines ({formDeadlines.length})
                        </div>

                        {formDeadlines.map((deadline, index) => (
                            <div key={index} className="surface-card p-3 border-round border-1 surface-border mb-3 shadow-1">
                                {/* Changed h5 to a standard text-base element with slightly dialed-back text color weights */}
                                <div className="text-base font-bold text-primary-600 mb-3">
                                    {index + 1}. Stage: {deadline.stageName}
                                </div>

                                <div className="grid formgrid">
                                    <div className="field col-12 md:col-6 mb-0">
                                        <label className="text-xs font-semibold text-500">Submission Deadline</label>
                                        <PrimeCalendar
                                            value={deadline.submission ? new Date(deadline.submission) : null}
                                            onChange={(e) => handleDeadlineChange(index, 'submission', e.value ?? null)}
                                            showTime
                                            hourFormat="24"
                                            placeholder="Select Date & Time"
                                            className={classNames({ 'p-invalid': submitted && !deadline.submission })}
                                        />
                                    </div>
                                    <div className="field col-12 md:col-6 mb-0">
                                        <label className="text-xs font-semibold text-500">Evaluation Deadline</label>
                                        <PrimeCalendar
                                            value={deadline.evaluation ? new Date(deadline.evaluation) : null}
                                            onChange={(e) => handleDeadlineChange(index, 'evaluation', e.value ?? null)}
                                            showTime
                                            hourFormat="24"
                                            placeholder="Select Date & Time"
                                            className={classNames({ 'p-invalid': submitted && !deadline.evaluation })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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