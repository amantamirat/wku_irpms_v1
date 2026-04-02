'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Grant } from '../../models/grant.model';
import { GrantApi } from '../../api/grant.api';
import { Calendar } from '@/app/(main)/calendars/models/calendar.model';
import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';

import { GrantAllocation, validateGrantAllocation, sanitizeGrantAllocation } from '../models/grant.allocation.model';
import { GrantAllocationApi } from '../api/grant.allocation.api';

const SaveAllocation = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<GrantAllocation>) => {
    const toast = useRef<Toast>(null);
    const [localAllocation, setLocalAllocation] = useState<GrantAllocation>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);

    const isGrantPredefined = !!item.grant;
    const isCalendarPredefined = !!item.calendar;

    // Load Grants if not passed in via props
    useEffect(() => {
        if (isGrantPredefined || !visible) return;
        GrantApi.getAll().then(setGrants).catch(console.error);
    }, [isGrantPredefined, visible]);

    // Load Calendars if not passed in via props
    useEffect(() => {
        if (isCalendarPredefined || !visible) return;
        CalendarApi.getAll().then(setCalendars).catch(console.error);
    }, [isCalendarPredefined, visible]);

    useEffect(() => {
        setLocalAllocation({ ...item });
    }, [item]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalAllocation({ ...item });
    };

    const saveAllocation = async () => {
        setSubmitted(true);
        try {
            const validation = validateGrantAllocation(localAllocation);
            if (!validation.valid) throw new Error(validation.message);

            // Clean data (convert objects to IDs for backend)
            const payload = sanitizeGrantAllocation(localAllocation);

            let saved: GrantAllocation;
            if (localAllocation._id) {
                saved = await GrantAllocationApi.update(payload);
            } else {
                saved = await GrantAllocationApi.create(payload as GrantAllocation);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Allocation saved successfully',
                life: 2000,
            });

            onComplete?.({
                ...saved, calendar: localAllocation.calendar,
                grant: localAllocation.grant
            });
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Budget Error',
                detail: err.message || 'Check grant capacity',
                life: 4000,
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
            <Button label="Save Allocation" icon="pi pi-check" onClick={saveAllocation} severity="success" />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localAllocation._id ? 'Edit Allocation' : 'New Grant Allocation'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Grant Selection */}
                <div className="field">
                    <label htmlFor="grant" className="font-bold">Grant Source</label>
                    {isGrantPredefined ? (
                        <InputText value={(localAllocation.grant as Grant)?.title || 'Selected Grant'} disabled />
                    ) : (
                        <Dropdown
                            id="grant"
                            value={localAllocation.grant}
                            options={grants}
                            optionLabel="title"
                            dataKey="_id"
                            placeholder="Select a Grant"
                            onChange={(e) => setLocalAllocation({ ...localAllocation, grant: e.value })}
                            className={classNames({ 'p-invalid': submitted && !localAllocation.grant })}
                        />
                    )}
                </div>

                {/* Calendar Selection */}
                <div className="field">
                    <label htmlFor="calendar" className="font-bold">Target Year / Calendar</label>
                    {isCalendarPredefined ? (
                        <InputText value={(localAllocation.calendar as Calendar)?.year?.toString() || 'Selected Year'} disabled />
                    ) : (
                        <Dropdown
                            id="calendar"
                            value={localAllocation.calendar}
                            options={calendars}
                            optionLabel="year"
                            dataKey="_id"
                            placeholder="Select Calendar Year"
                            onChange={(e) => setLocalAllocation({ ...localAllocation, calendar: e.value })}
                            className={classNames({ 'p-invalid': submitted && !localAllocation.calendar })}
                        />
                    )}
                </div>

                {/* Budget Input */}
                <div className="field">
                    <label htmlFor="totalBudget" className="font-bold">Allocated Amount</label>
                    <InputNumber
                        id="totalBudget"
                        value={localAllocation.totalBudget}
                        onValueChange={(e) => setLocalAllocation({ ...localAllocation, totalBudget: e.value || 0 })}
                        mode="currency"
                        currency="USD" // Change to your project's currency
                        locale="en-US"
                        min={0}
                        className={classNames({ 'p-invalid': submitted && localAllocation.totalBudget <= 0 })}
                    />
                    {localAllocation._id && (
                        <small className="text-secondary block mt-1">
                            Currently used: <strong>{localAllocation.usedBudget || 0}</strong>
                        </small>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SaveAllocation;