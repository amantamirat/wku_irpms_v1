'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { extractId } from '@/utils/utils';

import {
    Enrollment,
    validateEnrollment
} from '../models/enrollment.model';

import { User } from '../../models/user.model';
import { UserApi } from '../../api/user.api';

import {
    Calendar,
    CalendarStatus
} from '@/app/(main)/calendars/models/calendar.model';
import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';

import {
    Organization,
    OrgnUnit
} from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';

const EnrollmentForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Enrollment>) => {
    const [localEnrollment, setLocalEnrollment] =
        useState<Enrollment>(() => ({ ...item }));

    const [submitted, setSubmitted] = useState(false);

    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [programs, setPrograms] = useState<Organization[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    const isStudentPredefined = !!item?.student;

    useEffect(() => {
        setLocalEnrollment({ ...item });
        setSubmitted(false);
    }, [item]);

    useEffect(() => {
        let cancelled = false;

        const loadOptions = async () => {
            try {
                const requests = await Promise.all([
                    CalendarApi.lookup!({
                        status: CalendarStatus.active
                    }),

                    OrganizationApi.lookup!({
                        type: OrgnUnit.program
                    }),

                    isStudentPredefined
                        ? Promise.resolve(null)
                        : UserApi.lookup!({})
                ]);

                if (cancelled) return;

                if (requests[0]) {
                    setCalendars(requests[0]);
                }

                if (requests[1]) {
                    setPrograms(requests[1]);
                }

                if (requests[2]) {
                    setUsers(requests[2]);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        'Error loading enrollment form options:',
                        error
                    );
                }
            }
        };

        void loadOptions();

        return () => {
            cancelled = true;
        };
    }, [
        isStudentPredefined
    ]);

    const updateField = <K extends keyof Enrollment>(
        key: K,
        value: Enrollment[K]
    ) => {
        setLocalEnrollment((previous) => ({
            ...previous,
            [key]: value
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const normalizedEnrollment: Enrollment = {
            ...localEnrollment,
            student: extractId(localEnrollment.student) as Enrollment['student'],
            calendar: extractId(localEnrollment.calendar) as Enrollment['calendar'],
            program: extractId(localEnrollment.program) as Enrollment['program']
        };

        const result = validateEnrollment(normalizedEnrollment);

        if (!result.valid) return;

        await onSubmit(normalizedEnrollment);
    };

    const validation = submitted
        ? validateEnrollment(localEnrollment)
        : undefined;

    const fieldInvalid = (field: keyof Enrollment) => {
        if (!submitted) return false;

        switch (field) {
            case 'student':
                return !localEnrollment.student;

            case 'calendar':
                return !localEnrollment.calendar;

            case 'program':
                return !localEnrollment.program;

            default:
                return false;
        }
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="formgrid grid p-fluid"
            noValidate
        >
            {/* Student */}
            <div className="field col-12">
                <label
                    htmlFor="enrollment-student"
                    className="font-medium text-900 block mb-2"
                >
                    Student <span className="text-red-500">*</span>
                </label>

                {isStudentPredefined ? (
                    <InputText
                        id="enrollment-student"
                        value={
                            typeof localEnrollment.student === 'object'
                                ? (localEnrollment.student as User).name ?? ''
                                : 'Linked Student'
                        }
                        disabled
                        className="w-full"
                    />
                ) : (
                    <Dropdown
                        id="enrollment-student"
                        value={extractId(localEnrollment.student)}
                        options={users}
                        optionLabel="name"
                        optionValue="_id"
                        onChange={(e) =>
                            updateField(
                                'student',
                                e.value as Enrollment['student']
                            )
                        }
                        placeholder="Select Student"
                        showClear
                        filter
                        className={classNames('w-full', {
                            'p-invalid': fieldInvalid('student')
                        })}
                    />
                )}

                {fieldInvalid('student') && (
                    <small className="p-error block mt-1">
                        Student is required.
                    </small>
                )}
            </div>

            {/* Academic Calendar */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="enrollment-calendar"
                    className="font-medium text-900 block mb-2"
                >
                    Academic Calendar <span className="text-red-500">*</span>
                </label>

                <Dropdown
                    id="enrollment-calendar"
                    value={extractId(localEnrollment.calendar)}
                    options={calendars}
                    optionLabel="year"
                    optionValue="_id"
                    onChange={(e) =>
                        updateField(
                            'calendar',
                            e.value as Enrollment['calendar']
                        )
                    }
                    placeholder="Select Academic Calendar"
                    showClear
                    filter
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('calendar')
                    })}
                />


                {fieldInvalid('calendar') && (
                    <small className="p-error block mt-1">
                        Academic calendar is required.
                    </small>
                )}
            </div>

            {/* Program */}
            <div className="field col-12 md:col-6">
                <label
                    htmlFor="enrollment-program"
                    className="font-medium text-900 block mb-2"
                >
                    Program <span className="text-red-500">*</span>
                </label>

                <Dropdown
                    id="enrollment-program"
                    value={extractId(localEnrollment.program)}
                    options={programs}
                    optionLabel="name"
                    optionValue="_id"
                    onChange={(e) =>
                        updateField(
                            'program',
                            e.value as Enrollment['program']
                        )
                    }
                    placeholder="Select Program"
                    showClear
                    filter
                    className={classNames('w-full', {
                        'p-invalid': fieldInvalid('program')
                    })}
                />


                {fieldInvalid('program') && (
                    <small className="p-error block mt-1">
                        Program is required.
                    </small>
                )}
            </div>

            {validation && !validation.valid && (
                <div className="col-12">
                    <small className="p-error block">
                        {validation.message}
                    </small>
                </div>
            )}
        </form>
    );
};

export default EnrollmentForm;