'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

// Types & APIs
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Enrollment, validateEnrollment } from '../models/enrollment.model';
import { EnrollmentApi } from '../api/enrollment.api';
import { User } from '../../models/user.model';
import { UserApi } from '../../api/user.api';
import { Calendar, CalendarStatus } from '@/app/(main)/calendars/models/calendar.model';
import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';
import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';

const SaveEnrollmentDialog = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<Enrollment>) => {
    const toast = useRef<Toast>(null);

    // State
    const [localEnrollment, setLocalEnrollment] = useState<Enrollment>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Dropdown Data
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [programs, setPrograms] = useState<Organization[]>([]);
    const [applicants, setApplicants] = useState<User[]>([]);

    // Predefined Logic
    const isStudPredefined = !!item.student;
    const isCalendarPredefined = !!item.calendar;
    const isProgramPredefined = !!item.program;

    /**
     * Fetch Dropdown Data
     * Only fetches if the specific entity isn't already provided via props
     */
    useEffect(() => {
        if (!visible) return;

        const fetchData = async () => {
            try {
                const requests: Promise<any>[] = [];

                if (!isCalendarPredefined)
                    requests.push(CalendarApi.getAll({ status: CalendarStatus.active }).then(setCalendars));

                if (!isProgramPredefined)
                    requests.push(OrganizationApi.getAll({ type: OrgnUnit.program }).then(setPrograms));

                if (!isStudPredefined)
                    requests.push(UserApi.getAll({}).then(setApplicants));

                await Promise.all(requests);
            } catch (err) {
                console.error('Error loading dialog data:', err);
            }
        };

        fetchData();
    }, [visible, isStudPredefined, isCalendarPredefined, isProgramPredefined]);

    /**
     * Sync local state with prop updates
     */
    useEffect(() => {
        setLocalEnrollment({ ...item });
    }, [item]);

    const handleHide = () => {
        setSubmitted(false);
        onHide();
    };

    const saveStudent = async () => {
        setSubmitted(true);

        const validation = validateEnrollment(localEnrollment);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation Error',
                detail: validation.message,
                life: 3000,
            });
            return;
        }

        setLoading(true);
        try {
            let saved: Enrollment;
            if (localEnrollment._id) {
                saved = await EnrollmentApi.update(localEnrollment);
            } else {
                saved = await EnrollmentApi.create(localEnrollment);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Student record saved successfully',
                life: 2000,
            });

            onComplete?.({
                ...localEnrollment,
                _id: saved._id
            });
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Save Failed',
                detail: err.message || 'An unexpected error occurred',
                life: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={handleHide} disabled={loading} />
            <Button label="Save Student" icon="pi pi-check" onClick={saveStudent} loading={loading} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localEnrollment._id ? 'Edit Student Profile' : 'New Student Registration'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={handleHide}
            >
                {/* Applicant Selection */}
                <div className="field">
                    <label htmlFor="applicant" className="font-bold text-sm">Applicant</label>
                    {isStudPredefined ? (
                        <InputText
                            value={(localEnrollment.student as User)?.name || 'Linked User'}
                            disabled
                            className="bg-gray-100"
                        />
                    ) : (
                        <Dropdown
                            id="applicant"
                            value={localEnrollment.student}
                            options={applicants}
                            optionLabel="name"
                            dataKey="_id"
                            placeholder="Select an Applicant"
                            onChange={(e) => setLocalEnrollment({ ...localEnrollment, student: e.value })}
                            className={classNames({ 'p-invalid': submitted && !localEnrollment.student })}
                        />
                    )}
                </div>

                {/* Calendar Selection */}
                <div className="field">
                    <label htmlFor="calendar" className="font-bold text-sm">Academic Calendar</label>
                    {isCalendarPredefined ? (
                        <InputText
                            value={(localEnrollment.calendar as Calendar)?.year?.toString() || 'Assigned Year'}
                            disabled
                            className="bg-gray-100"
                        />
                    ) : (
                        <Dropdown
                            id="calendar"
                            value={localEnrollment.calendar}
                            options={calendars}
                            optionLabel="year"
                            dataKey="_id"
                            placeholder="Select Year"
                            onChange={(e) => setLocalEnrollment({ ...localEnrollment, calendar: e.value })}
                            className={classNames({ 'p-invalid': submitted && !localEnrollment.calendar })}
                        />
                    )}
                </div>

                {/* Program Selection */}
                <div className="field">
                    <label htmlFor="program" className="font-bold text-sm">Program</label>
                    {isProgramPredefined ? (
                        <InputText
                            value={(localEnrollment.program as Organization)?.name || 'Assigned Program'}
                            disabled
                            className="bg-gray-100"
                        />
                    ) : (
                        <Dropdown
                            id="program"
                            value={localEnrollment.program}
                            options={programs}
                            optionLabel="name"
                            dataKey="_id"
                            placeholder="Select Program"
                            onChange={(e) => setLocalEnrollment({ ...localEnrollment, program: e.value })}
                            className={classNames({ 'p-invalid': submitted && !localEnrollment.program })}
                        />
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SaveEnrollmentDialog;