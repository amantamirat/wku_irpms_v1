'use client';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TreeSelect } from 'primereact/treeselect';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';

import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';
import { Calendar } from '@/app/(main)/calendars/models/calendar.model';

import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { GrantStatus } from '@/app/(main)/grants/models/grant.state-machine';

import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import {
    ThemeNode,
    buildTree
} from '@/app/(main)/thematics/models/thematic.node';

import { UserApi } from '@/app/(main)/users/api/user.api';

import { extractId } from "@/utils/utils";

import { Project } from '../../models/project.model';

interface BasicInfoStepProps {
    data: Partial<Project>;
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
    lockLead?: boolean;
    isEditModeOnly?: boolean;
}

export const BasicInfoStep = ({
    data,
    onUpdate,
    onNext,
    isEditModeOnly
}: BasicInfoStepProps) => {
    const [submitted, setSubmitted] = useState(false);

    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [themeNodes, setThemeNodes] = useState<ThemeNode[]>([]);

    // --- Applicants State ---
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // ----------------------------------------------------------------
    // Active Call
    // ----------------------------------------------------------------

    const activeCall = data.call ?? null;

    // ----------------------------------------------------------------
    // Active Grant & Calendar
    // ----------------------------------------------------------------

    const activeGrant = data.grant ?? null;
    const activeCalendar = data.calendar ?? null;

    const hasActiveGrant = Boolean(activeGrant);

    // ----------------------------------------------------------------
    // Field Locking
    // ----------------------------------------------------------------

    const isGrantLocked = isEditModeOnly || Boolean(activeCall);
    const isCalendarLocked = isEditModeOnly || Boolean(activeCall);
    const isLeadLocked = isEditModeOnly || Boolean(activeCall) || data.lockLead === true;

    // ----------------------------------------------------------------
    // Load Users
    // ----------------------------------------------------------------

    useEffect(() => {
        const fetchUsers = async () => {
            if (isLeadLocked) return;

            setLoadingUsers(true);

            try {
                const res = UserApi.lookup ? await UserApi.lookup() : [];
                setUsers(res || []);
            } catch (err) {
                console.error('Failed to fetch users:', err);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [isLeadLocked]);

    // ----------------------------------------------------------------
    // Load Grants & Calendars
    // ----------------------------------------------------------------

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                if (!isGrantLocked && GrantApi.lookup) {
                    const gData = await GrantApi.lookup({
                        status: GrantStatus.active
                    });
                    setGrants(gData || []);
                }

                if (!isCalendarLocked && CalendarApi.lookup) {
                    const cData = await CalendarApi.lookup();
                    setCalendars(cData || []);
                }
            } catch (err) {
                console.error('Failed to load initial form data:', err);
            }
        };

        loadInitialData();
    }, [isGrantLocked, isCalendarLocked]);

    // ----------------------------------------------------------------
    // Fetch Themes When Grant Changes
    // ----------------------------------------------------------------

    useEffect(() => {
        if (!activeGrant) {
            setThemeNodes([]);
            return;
        }

        const fetchThemes = async () => {
            try {
                let grant: Grant | null = null;

                if (typeof activeGrant === 'string') {
                    if (GrantApi.getById) {
                        grant = await GrantApi.getById(activeGrant);
                    }
                } else {
                    grant = activeGrant as Grant;
                }

                if (!grant) {
                    setThemeNodes([]);
                    return;
                }

                const thematicId = extractId(grant.thematic);

                if (!thematicId || !ThemeApi.lookup) {
                    setThemeNodes([]);
                    return;
                }

                const tData = await ThemeApi.lookup({
                    thematicArea: thematicId
                });

                setThemeNodes(buildTree(tData || []));
            } catch (err) {
                console.error('Failed to fetch themes:', err);
                setThemeNodes([]);
            }
        };

        fetchThemes();
    }, [activeGrant]);

    // ----------------------------------------------------------------
    // Lead Applicant Helpers
    // ----------------------------------------------------------------

    const selectedLeadMember = data.collaborators?.[0]?.member;
    const selectedLeadId = extractId(selectedLeadMember);

    const handleLeadChange = (selectedUserId: string) => {
        const selectedUserObj = users.find((u) => u._id === selectedUserId);
        const existingCollaborators = data.collaborators || [];

        const currentLead = existingCollaborators[0] || {};
        const nonLeadCollaborators = existingCollaborators.slice(1);

        const updatedLead = {
            ...currentLead,
            member: selectedUserObj || selectedUserId,
            role: currentLead.role || 'Lead PI',
            isLeadPI: true
        };

        onUpdate({
            leadPI: selectedUserObj,
            collaborators: [updatedLead, ...nonLeadCollaborators]
        });
    };

    // ----------------------------------------------------------------
    // Read-Only Label Helpers
    // ----------------------------------------------------------------

    const getGrantTitle = () => {
        if (activeGrant && typeof activeGrant === 'object') {
            return (activeGrant as Grant).title || 'Bound Grant Framework';
        }
        return 'Bound Grant Framework';
    };

    const getCalendarLabel = () => {
        if (activeCalendar && typeof activeCalendar === 'object') {
            return String((activeCalendar as Calendar).year || 'Bound Calendar Framework');
        }
        return 'Bound Calendar Framework';
    };

    const getLeadName = () => {
        if (data.leadPI && typeof data.leadPI === 'object') {
            return (data.leadPI as any).name;
        }

        if (selectedLeadMember && typeof selectedLeadMember === 'object') {
            return (selectedLeadMember as any).name;
        }

        return 'Lead PI Profile';
    };

    // ----------------------------------------------------------------
    // Thematic Tree Select Helpers
    // ----------------------------------------------------------------

    const getThemeSelectionKeys = () => {
        const selection: Record<string, { checked: boolean; partialChecked: boolean }> = {};

        data.themes?.forEach((theme: any) => {
            const id = typeof theme === 'object' ? theme._id : theme;
            if (id) {
                selection[id] = {
                    checked: true,
                    partialChecked: false
                };
            }
        });

        return selection;
    };

    const onThemeChange = (e: any) => {
        if (!e.value) {
            onUpdate({ themes: [] });
            return;
        }

        const selectedIds = Object.keys(e.value).filter(
            (key) => e.value[key]?.checked
        );

        onUpdate({
            themes: selectedIds as any
        });
    };

    // ----------------------------------------------------------------
    // Submit / Forward Handler
    // ----------------------------------------------------------------

    const handleForward = () => {
        setSubmitted(true);

        const hasLead = Boolean(
            data.collaborators?.[0]?.member || data.leadPI
        );

        if (
            !hasActiveGrant ||
            !activeCalendar ||
            !data.title ||
            !data.themes ||
            data.themes.length === 0 ||
            !hasLead
        ) {
            return;
        }

        onNext();
    };

    // ----------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------

    return (
        <div className="p-fluid">
            {/* Grant & Lead Applicant */}
            <div className="formgrid grid">
                {/* Grant Source */}
                <div className="field col-12 md:col-6">
                    <label className="font-bold">Grant Source</label>

                    {isGrantLocked ? (
                        <InputText
                            value={getGrantTitle()}
                            disabled
                            className="surface-100"
                        />
                    ) : (
                        <Dropdown
                            value={data.grant}
                            options={grants}
                            dataKey="_id"
                            optionLabel="title"
                            onChange={(e) =>
                                onUpdate({
                                    grant: e.value,
                                    themes: [],
                                    phases: [],
                                    collaborators: data.collaborators?.slice(0, 1)
                                })
                            }
                            placeholder="Select Grant"
                            className={classNames({
                                'p-invalid': submitted && !data.grant
                            })}
                        />
                    )}
                </div>

                {/* Lead Applicant */}
                <div className="field col-12 md:col-6">
                    <label className="font-bold">Lead Applicant</label>

                    {isLeadLocked ? (
                        <InputText
                            value={getLeadName()}
                            disabled
                            className="surface-100"
                        />
                    ) : (
                        <Dropdown
                            value={selectedLeadId}
                            options={users}
                            onChange={(e) => handleLeadChange(e.value)}
                            optionLabel="name"
                            optionValue="_id"
                            filter
                            disabled={loadingUsers}
                            emptyMessage={
                                loadingUsers
                                    ? 'Loading applicants...'
                                    : 'No applicants found'
                            }

                            placeholder={
                                loadingUsers
                                    ? 'Loading applicants...'
                                    : 'Select Lead Applicant'
                            }
                            className={classNames({
                                'p-invalid':
                                    submitted &&
                                    !data.collaborators?.[0]?.member
                            })}
                        />
                    )}
                </div>
            </div>

            {/* Calendar */}
            <div className="field">
                <label htmlFor="calendar" className="font-bold">
                    Project Calendar Framework
                </label>

                {isCalendarLocked ? (
                    <InputText
                        id="calendar"
                        value={getCalendarLabel()}
                        disabled
                        className="surface-100"
                    />
                ) : (
                    <Dropdown
                        id="calendar"
                        value={data.calendar}
                        options={calendars}
                        dataKey="_id"
                        optionLabel="year"
                        onChange={(e) =>
                            onUpdate({
                                calendar: e.value
                            })
                        }
                        placeholder="Select Calendar Framework"
                        className={classNames({
                            'p-invalid': submitted && !data.calendar
                        })}
                    />
                )}
            </div>

            {/* Project Title */}
            <div className="field">
                <label htmlFor="title" className="font-bold">
                    Project Title
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
                        'p-invalid': submitted && !data.title
                    })}
                />
            </div>

            {/* Thematic Focus Area */}
            <div className="field">
                <label className="font-bold mb-2 block">
                    Thematic Focus Area
                </label>

                <TreeSelect
                    value={getThemeSelectionKeys()}
                    options={themeNodes}
                    onChange={onThemeChange}
                    display="chip"
                    selectionMode="checkbox"
                    placeholder={
                        hasActiveGrant
                            ? 'Select one or more structural options'
                            : 'Please select a grant source first'
                    }
                    disabled={!hasActiveGrant}
                    className={classNames('w-full', {
                        'p-invalid':
                            submitted &&
                            (!data.themes || data.themes.length === 0)
                    })}
                    filter
                    scrollHeight="200px"
                />
            </div>

            {/* Summary */}
            <div className="field">
                <label htmlFor="summary" className="font-bold">
                    Description Summary Abstract
                </label>

                <InputTextarea
                    id="summary"
                    value={data.summary ?? ''}
                    onChange={(e) =>
                        onUpdate({
                            summary: e.target.value
                        })
                    }
                    rows={4}
                    autoResize
                />
            </div>

            {/* Navigation */}
            {!isEditModeOnly && (
                <div className="flex justify-content-end mt-4 pt-3 border-top-1 surface-border">
                    <Button
                        label="Proceed to Phases"
                        icon="pi pi-angle-right"
                        iconPos="right"
                        onClick={handleForward}
                        className="w-auto px-5"
                    />
                </div>
            )}
        </div>
    );
};