'use client';

import React, { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';

import { Call } from '../../models/call.model';

import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';
import {
    Calendar,
    CalendarStatus
} from '@/app/(main)/calendars/models/calendar.model';

import { CompositionApi } from '@/app/(main)/compositions/api/composition.api';
import { Composition } from '@/app/(main)/compositions/models/composition.model';

import { ConstraintApi } from '@/app/(main)/constraints/api/constraint.api';
import { Constraint } from '@/app/(main)/constraints/models/constraint.model';

import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { GrantStatus } from '@/app/(main)/grants/models/grant.state-machine';

import { extractId } from '@/utils/utils';

interface CallInfoStepProps {
    data: Partial<Call>;
    onUpdate: (data: Partial<Call>) => void;
    onNext: () => void;
    isEditMode?: boolean;
}

export const CallInfoStep = ({
    data,
    onUpdate,
    onNext,
    isEditMode = false
}: CallInfoStepProps) => {
    const [submitted, setSubmitted] = useState(false);

    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [constraints, setConstraints] = useState<Constraint[]>([]);
    const [compositions, setCompositions] = useState<Composition[]>([]);

    useEffect(() => {
        const loadDependencies = async () => {
            try {
                const [
                    availableGrants,
                    availableCalendars,
                    availableConstraints,
                    availableCompositions
                ] = await Promise.all([
                    GrantApi.lookup!({
                        status: GrantStatus.active
                    }),
                    CalendarApi.lookup!({
                        status: CalendarStatus.active
                    }),
                    ConstraintApi.lookup!(),
                    CompositionApi.getAll()
                ]);

                setGrants(availableGrants || []);
                setCalendars(availableCalendars || []);
                setConstraints(availableConstraints || []);
                setCompositions(availableCompositions || []);
            } catch (err) {
                console.error(
                    'Failed to load Call dependencies:',
                    err
                );
            }
        };

        loadDependencies();
    }, []);

    const validateAndNext = () => {
        setSubmitted(true);

        if (
            data.calendar &&
            data.grant &&
            data.title?.trim()
        ) {
            onNext();
        }
    };

    return (
        <div className="mt-4 p-fluid">
            <div className="grid formgrid">

                {/* Calendar */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="calendar"
                        className="font-bold"
                    >
                        Operational Year *
                    </label>

                    <Dropdown
                        id="calendar"
                        value={data.calendar}
                        options={calendars}
                        optionLabel="year"
                        dataKey="_id"
                        onChange={(e) =>
                            onUpdate({
                                calendar: e.value
                            })
                        }
                        placeholder="Select Year"
                        className={classNames({
                            'p-invalid':
                                submitted && !data.calendar
                        })}
                    />

                    {submitted && !data.calendar && (
                        <small className="p-error">
                            Operational Year is required.
                        </small>
                    )}
                </div>

                {/* Grant */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="grant"
                        className="font-bold"
                    >
                        Grant *
                    </label>

                    <Dropdown
                        id="grant"
                        value={extractId(data.grant)}
                        options={grants}
                        optionLabel="title"
                        optionValue="_id"
                        onChange={(e) =>
                            onUpdate({
                                grant: e.value
                            })
                        }
                        placeholder="Select Grant"
                        disabled={isEditMode}
                        className={classNames({
                            'p-invalid':
                                submitted && !data.grant
                        })}
                    />

                    {submitted && !data.grant && (
                        <small className="p-error">
                            Grant selection is required.
                        </small>
                    )}

                    {
                        /*
                    isEditMode && (
                        <small className="text-color-secondary mt-1">
                            Grant cannot be changed after the call is created.
                        </small>
                    )*/
                    }
                </div>
            </div>

            {/* Title */}
            <div className="field">
                <label
                    htmlFor="title"
                    className="font-bold"
                >
                    Call Title *
                </label>

                <InputText
                    id="title"
                    value={data.title || ''}
                    onChange={(e) =>
                        onUpdate({
                            title: e.target.value
                        })
                    }
                    className={classNames({
                        'p-invalid':
                            submitted &&
                            !data.title?.trim()
                    })}
                    placeholder="e.g., Annual Research Grant Call 2026"
                />

                {submitted && !data.title?.trim() && (
                    <small className="p-error">
                        Title is required.
                    </small>
                )}
            </div>

            {/* Constraint & Composition */}
            <div className="grid formgrid">

                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="constraint"
                        className="font-semibold block mb-2"
                    >
                        Constraint Profile
                    </label>

                    <Dropdown
                        id="constraint"
                        value={extractId(data.constraint)}
                        options={constraints}
                        optionLabel="name"
                        optionValue="_id"
                        onChange={(e) =>
                            onUpdate({
                                constraint: e.value
                            })
                        }
                        placeholder="Select Constraint (Optional)"
                        showClear
                    />
                </div>

                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="composition"
                        className="font-semibold block mb-2"
                    >
                        Composition Template
                    </label>

                    <Dropdown
                        id="composition"
                        value={extractId(data.composition)}
                        options={compositions}
                        optionLabel="name"
                        optionValue="_id"
                        onChange={(e) =>
                            onUpdate({
                                composition: e.value
                            })
                        }
                        placeholder="Select Composition (Optional)"
                        showClear
                    />
                </div>
            </div>

            {/* Description */}
            <div className="field">
                <label
                    htmlFor="description"
                    className="font-bold"
                >
                    Description & Instructions
                </label>

                <InputTextarea
                    id="description"
                    value={data.description || ''}
                    onChange={(e) =>
                        onUpdate({
                            description: e.target.value
                        })
                    }
                    rows={4}
                    placeholder="Provide overview, guidelines, or instructions for applicants..."
                />
            </div>

            {/* Navigation - creation only */}
            {!isEditMode && (
                <div className="flex justify-content-end mt-5 pt-3 border-top-1 surface-border">
                    <Button
                        label="Next: Configure Stages"
                        icon="pi pi-chevron-right"
                        iconPos="right"
                        onClick={validateAndNext}
                        className="px-5"
                    />
                </div>
            )}
        </div>
    );
};