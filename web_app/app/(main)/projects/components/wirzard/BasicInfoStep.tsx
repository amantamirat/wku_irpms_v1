'use client';

import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TreeSelect } from 'primereact/treeselect';
import { classNames } from 'primereact/utils';
import { useEffect, useMemo, useState } from 'react';

import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';
import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import { UserApi } from '@/app/(main)/users/api/user.api';

import { Calendar } from '@/app/(main)/calendars/models/calendar.model';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { GrantStatus } from '@/app/(main)/grants/models/grant.state-machine';
import { ThemeNode, buildTree } from '@/app/(main)/thematics/models/thematic.node';
import { Project } from '../../models/project.model';

interface BasicInfoStepProps {
    data: Partial<Project>;
    //call?: Call; // Strictly a Call object or undefined
    onUpdate: (data: Partial<Project>) => void;
    onNext: () => void;
    isEditModeOnly?: boolean;
}

export const BasicInfoStep = ({ data, onUpdate, onNext, isEditModeOnly }: BasicInfoStepProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [themeNodes, setThemeNodes] = useState<ThemeNode[]>([]);

    // --- Applicants State ---
    const [applicants, setApplicants] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // 1. Resolve active Call object directly from prop or data.call
    const activeCall = useMemo(() => {
        //if (call) return call;
        if (data.call) return data.call;
        return null;
    }, [data.call]);

    const hasCall = Boolean(activeCall);

    // 2. Resolve Active Grant & Calendar
    const activeGrant = useMemo(() => {
        if (data.grant) return data.grant;
        //if (activeCall?.grant) return activeCall.grant;
        return null;
    }, [data.grant]);

    const activeCalendar = useMemo(() => {
        if (data.calendar) return data.calendar;
        //if (activeCall?.calendar) return activeCall.calendar;
        return null;
    }, [data.calendar]);

    const hasActiveGrant = Boolean(activeGrant);

    // Lock fields if in Edit mode OR attached to a Call
    const isGrantLocked = isEditModeOnly || hasCall;
    const isCalendarLocked = isEditModeOnly || hasCall;
    const isLeadLocked = isEditModeOnly || hasCall;

    // 3. Sync Call, Grant, and Calendar back to project state
    /*
    useEffect(() => {
        if (activeCall) {
            const updates: Partial<Project> = {};

            if (!data.call) {
                updates.call = activeCall as any;
            }
            if (activeCall.grant && !data.grant) {
                updates.grant = activeCall.grant as any;
            }
            if (activeCall.calendar && !data.calendar) {
                updates.calendar = activeCall.calendar as any;
            }

            if (Object.keys(updates).length > 0) {
                onUpdate(updates);
            }
        }
    }, [activeCall]);
    */

    // 4. Load Applicants
    useEffect(() => {
        const fetchUsers = async () => {
            if (!isLeadLocked) {
                setLoadingUsers(true);
                try {
                    const res = await UserApi.getAll({});
                    setApplicants(res || []);
                } catch (err) {
                    console.error("Failed to fetch applicants:", err);
                } finally {
                    setLoadingUsers(false);
                }
            }
        };
        fetchUsers();
    }, [isLeadLocked]);

    // 5. Load Active Grants & Calendars (if fields aren't locked)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                if (!isGrantLocked) {
                    const gData = await GrantApi.getAll({ status: GrantStatus.active, populate: true });
                    setGrants(gData || []);
                }

                if (!isCalendarLocked) {
                    const cData = await CalendarApi.getAll();
                    setCalendars(cData || []);
                }
            } catch (err) {
                console.error('Failed to load initial form data:', err);
            }
        };
        loadInitialData();
    }, [isGrantLocked, isCalendarLocked]);

    // 6. Fetch Themes whenever activeGrant resolves
    useEffect(() => {
        const handleThemes = async () => {
            if (!activeGrant) {
                setThemeNodes([]);
                return;
            }

            const grantId = typeof activeGrant === 'object' ? (activeGrant as any)._id : activeGrant;

            if (grantId) {
                let fullGrantObject = typeof activeGrant === 'object' ? (activeGrant as Grant) : null;

                if (!fullGrantObject) {
                    fullGrantObject = grants.find(g => g._id === grantId) || null;
                }

                const thematicId = fullGrantObject ? (fullGrantObject as any).thematic : null;

                if (thematicId) {
                    try {
                        const tData = await ThemeApi.getAll({ thematicArea: thematicId });
                        setThemeNodes(buildTree(tData));
                    } catch (err) {
                        console.error('Failed to fetch themes:', err);
                        setThemeNodes([]);
                    }
                }
            }
        };

        handleThemes();
    }, [activeGrant, grants]);

    // --- Lead Applicant Helpers ---
    const selectedLeadMember = data.collaborators?.[0]?.member;
    const selectedLeadId = typeof selectedLeadMember === 'object' ? selectedLeadMember?._id : selectedLeadMember;

    const handleLeadChange = (selectedUser: any) => {
        const existingCollaborators = data.collaborators || [];
        const currentLead = existingCollaborators[0] || {};
        const nonLeadCollaborators = existingCollaborators.slice(1);

        const updatedLead = {
            ...currentLead,
            member: selectedUser,
            role: currentLead.role || 'Lead PI',
            isLeadPI: true,
        };

        onUpdate({
            collaborators: [updatedLead, ...nonLeadCollaborators]
        });
    };

    // --- Read-Only Label Helpers ---
    const getGrantTitle = () => {
        if (activeGrant && typeof activeGrant === 'object') return (activeGrant as any).title;
        return 'Bound Grant Framework';
    };

    const getCalendarLabel = () => {
        if (activeCalendar && typeof activeCalendar === 'object') return (activeCalendar as any).year;
        return 'Bound Calendar Framework';
    };

    const getLeadName = () => {
        if (data.leadPI && typeof data.leadPI === 'object') return (data.leadPI as any).name;
        if (selectedLeadMember && typeof selectedLeadMember === 'object') return (selectedLeadMember as any).name;
        return 'Lead PI Profile';
    };

    // --- Thematic Tree Select Helpers ---
    const getThemeSelectionKeys = () => {
        const selection: any = {};
        data.themes?.forEach((t: any) => {
            const id = typeof t === 'object' ? t._id : t;
            selection[id] = { checked: true, partialChecked: false };
        });
        return selection;
    };

    const onThemeChange = (e: any) => {
        const selectedIds = Object.keys(e.value).filter(key => e.value[key].checked);
        onUpdate({ themes: selectedIds as any });
    };

    // --- Submit / Forward Handler ---
    const handleForward = () => {
        setSubmitted(true);
        const hasLead = Boolean(data.collaborators?.[0]?.member || data.leadPI);

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

    return (
        <div className="p-fluid">
            <div className="formgrid grid">
                {/* Grant Source Field */}
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
                            className={classNames({ 'p-invalid': submitted && !data.grant })}
                        />
                    )}
                </div>

                {/* Lead Applicant Dropdown */}
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
                            options={applicants}
                            onChange={(e) => handleLeadChange(e.value)}
                            optionLabel="name"
                            optionValue="_id"
                            filter
                            disabled={loadingUsers}
                            emptyMessage={loadingUsers ? "Loading applicants..." : "No applicants found"}
                            placeholder={loadingUsers ? "Loading applicants..." : "Select Lead Applicant"}
                            className={classNames({ 'p-invalid': submitted && !data.collaborators?.[0]?.member })}
                        />
                    )}
                </div>
            </div>

            {/* Calendar Selection Field */}
            <div className="field">
                <label htmlFor="calendar" className="font-bold">Project Calendar Framework</label>
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
                        onChange={(e) => onUpdate({ calendar: e.value })}
                        placeholder="Select Calendar Framework"
                        className={classNames({ 'p-invalid': submitted && !data.calendar })}
                    />
                )}
            </div>

            {/* Title Input */}
            <div className="field">
                <label htmlFor="title" className="font-bold">Project Title</label>
                <InputText
                    id="title"
                    value={data.title || ''}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className={classNames({ 'p-invalid': submitted && !data.title })}
                />
            </div>

            {/* Thematics Tree Select */}
            <div className="field">
                <label className="font-bold mb-2 block">Thematic Focus Area</label>
                <TreeSelect
                    value={getThemeSelectionKeys()}
                    options={themeNodes}
                    onChange={onThemeChange}
                    display="chip"
                    selectionMode="checkbox"
                    placeholder={hasActiveGrant ? "Select one or more structural options" : "Please select a grant source first"}
                    disabled={!hasActiveGrant}
                    className={classNames('w-full', { 'p-invalid': submitted && (!data.themes || data.themes.length === 0) })}
                    filter
                    scrollHeight="200px"
                />
            </div>

            {/* Summary Text Box */}
            <div className="field">
                <label htmlFor="summary" className="font-bold">Description Summary Abstract</label>
                <InputTextarea
                    id="summary"
                    value={data.summary ?? ''}
                    onChange={(e) => onUpdate({ summary: e.target.value })}
                    rows={4}
                    autoResize
                />
            </div>

            {/* Navigation Row */}
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