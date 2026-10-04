'use client';

import { Button } from 'primereact/button';
import { Chips } from 'primereact/chips';
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

import { Project, IProjectObjectives } from '../../models/project.model';

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

    // --- Temporary state for adding a specific objective ---
    const [newSpecificObj, setNewSpecificObj] = useState('');

    const activeCall = data.call ?? null;
    const activeGrant = data.grant ?? null;
    const activeCalendar = data.calendar ?? null;
    const hasActiveGrant = Boolean(activeGrant);

    const isGrantLocked = isEditModeOnly || Boolean(activeCall);
    const isCalendarLocked = isEditModeOnly || Boolean(activeCall);
    const isLeadLocked = isEditModeOnly || Boolean(activeCall) || data.lockLead === true;

    // Load Users
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

    // Load Grants & Calendars
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                if (!isGrantLocked && GrantApi.lookup) {
                    const gData = await GrantApi.lookup({ status: GrantStatus.active });
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

    // Fetch Themes When Grant Changes
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

                const tData = await ThemeApi.lookup({ thematicArea: thematicId });
                setThemeNodes(buildTree(tData || []));
            } catch (err) {
                console.error('Failed to fetch themes:', err);
                setThemeNodes([]);
            }
        };

        fetchThemes();
    }, [activeGrant]);

    // Lead Applicant Helpers
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

    const getGrantTitle = () => (activeGrant && typeof activeGrant === 'object' ? (activeGrant as Grant).title || 'Bound Grant Framework' : 'Bound Grant Framework');
    const getCalendarLabel = () => (activeCalendar && typeof activeCalendar === 'object' ? String((activeCalendar as Calendar).year || 'Bound Calendar Framework') : 'Bound Calendar Framework');
    const getLeadName = () => {
        if (data.leadPI && typeof data.leadPI === 'object') return (data.leadPI as any).name;
        if (selectedLeadMember && typeof selectedLeadMember === 'object') return (selectedLeadMember as any).name;
        return 'Lead PI Profile';
    };

    const getThemeSelectionKeys = () => {
        const selection: Record<string, { checked: boolean; partialChecked: boolean }> = {};
        data.themes?.forEach((theme: any) => {
            const id = typeof theme === 'object' ? theme._id : theme;
            if (id) {
                selection[id] = { checked: true, partialChecked: false };
            }
        });
        return selection;
    };

    const onThemeChange = (e: any) => {
        if (!e.value) {
            onUpdate({ themes: [] });
            return;
        }
        const selectedIds = Object.keys(e.value).filter((key) => e.value[key]?.checked);
        onUpdate({ themes: selectedIds as any });
    };

    // Objective Handlers
    const handleGeneralObjectiveChange = (value: string) => {
        const currentObjectives: IProjectObjectives = data.objectives || { general: '', specific: [] };
        onUpdate({
            objectives: {
                ...currentObjectives,
                general: value
            }
        });
    };

    const handleAddSpecificObjective = () => {
        if (!newSpecificObj.trim()) return;
        const currentObjectives: IProjectObjectives = data.objectives || { general: '', specific: [] };
        onUpdate({
            objectives: {
                ...currentObjectives,
                specific: [...(currentObjectives.specific || []), newSpecificObj.trim()]
            }
        });
        setNewSpecificObj('');
    };

    const handleRemoveSpecificObjective = (index: number) => {
        const currentObjectives: IProjectObjectives = data.objectives || { general: '', specific: [] };
        const updatedSpecific = [...(currentObjectives.specific || [])];
        updatedSpecific.splice(index, 1);
        onUpdate({
            objectives: {
                ...currentObjectives,
                specific: updatedSpecific
            }
        });
    };

    const handleForward = () => {
        setSubmitted(true);
        const hasLead = Boolean(data.collaborators?.[0]?.member || data.leadPI);

        if (!hasActiveGrant || !activeCalendar || !data.title || !data.themes || data.themes.length === 0 || !hasLead) {
            return;
        }
        onNext();
    };

    return (
        <div className="p-fluid">
            {/* Section 1: Framework & Leadership */}
            <div className="card surface-card p-4 shadow-1 border-round mb-4">
                <h5 className="text-900 font-semibold mb-3 flex align-items-center">
                    <i className="pi pi-id-card mr-2 text-primary" /> Project Setup & Leadership
                </h5>
                <div className="formgrid grid">
                    {/* Grant Source */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold block mb-2">Grant Source</label>
                        {isGrantLocked ? (
                            <InputText value={getGrantTitle()} disabled className="surface-100" />
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

                    {/* Lead Applicant */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold block mb-2">Lead Applicant</label>
                        {isLeadLocked ? (
                            <InputText value={getLeadName()} disabled className="surface-100" />
                        ) : (
                            <Dropdown
                                value={selectedLeadId}
                                options={users}
                                onChange={(e) => handleLeadChange(e.value)}
                                optionLabel="name"
                                optionValue="_id"
                                filter
                                disabled={loadingUsers}
                                emptyMessage={loadingUsers ? 'Loading applicants...' : 'No applicants found'}
                                placeholder={loadingUsers ? 'Loading applicants...' : 'Select Lead Applicant'}
                                className={classNames({
                                    'p-invalid': submitted && !data.collaborators?.[0]?.member
                                })}
                            />
                        )}
                    </div>
                </div>

                {/* Calendar */}
                <div className="field mt-2">
                    <label htmlFor="calendar" className="font-bold block mb-2">
                        Project Calendar Framework
                    </label>
                    {isCalendarLocked ? (
                        <InputText id="calendar" value={getCalendarLabel()} disabled className="surface-100" />
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
            </div>

            {/* Section 2: Core Details */}
            <div className="card surface-card p-4 shadow-1 border-round mb-4">
                <h5 className="text-900 font-semibold mb-3 flex align-items-center">
                    <i className="pi pi-file-edit mr-2 text-primary" /> Core Information
                </h5>

                {/* Project Title */}
                <div className="field">
                    <label htmlFor="title" className="font-bold block mb-2">Project Title</label>
                    <InputText
                        id="title"
                        value={data.title || ''}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        placeholder="Enter concise project title..."
                        className={classNames({ 'p-invalid': submitted && !data.title })}
                    />
                </div>

                {/* Thematic Focus Area */}
                <div className="field mt-3">
                    <label className="font-bold block mb-2">Thematic Focus Area</label>
                    <TreeSelect
                        value={getThemeSelectionKeys()}
                        options={themeNodes}
                        onChange={onThemeChange}
                        display="chip"
                        selectionMode="checkbox"
                        placeholder={hasActiveGrant ? 'Select one or more structural options' : 'Please select a grant source first'}
                        disabled={!hasActiveGrant}
                        className={classNames('w-full', {
                            'p-invalid': submitted && (!data.themes || data.themes.length === 0)
                        })}
                        filter
                        scrollHeight="200px"
                    />
                </div>

                {/* Keywords (Chips) */}
                <div className="field mt-3">
                    <label htmlFor="keywords" className="font-bold block mb-2">Keywords / Tags</label>
                    <Chips
                        id="keywords"
                        value={data.keywords || []}
                        onChange={(e) => onUpdate({ keywords: e.value || [] })}
                        placeholder="Type keyword and press enter..."
                        className="w-full"
                    />
                    <small className="text-secondary">Helps categorize and tag your project for discovery.</small>
                </div>
            </div>

            {/* Section 3: Summary & Objectives */}
            <div className="card surface-card p-4 shadow-1 border-round mb-4">
                <h5 className="text-900 font-semibold mb-3 flex align-items-center">
                    <i className="pi pi-compass mr-2 text-primary" /> Summary & Objectives
                </h5>

                {/* Summary */}
                <div className="field">
                    <label htmlFor="summary" className="font-bold block mb-2">Description Summary Abstract</label>
                    <InputTextarea
                        id="summary"
                        value={data.summary ?? ''}
                        onChange={(e) => onUpdate({ summary: e.target.value })}
                        rows={4}
                        autoResize
                        placeholder="Provide a brief summary of the project..."
                    />
                </div>

                {/* General Objective */}
                <div className="field mt-3">
                    <label htmlFor="generalObjective" className="font-bold block mb-2">General Objective</label>
                    <InputTextarea
                        id="generalObjective"
                        value={data.objectives?.general ?? ''}
                        onChange={(e) => handleGeneralObjectiveChange(e.target.value)}
                        rows={2}
                        autoResize
                        placeholder="State the primary goal of the project..."
                    />
                </div>

                {/* Specific Objectives */}
                <div className="field mt-3">
                    <label className="font-bold block mb-2">Specific Objectives</label>
                    <div className="flex gap-2 mb-2">
                        <InputText
                            value={newSpecificObj}
                            onChange={(e) => setNewSpecificObj(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSpecificObjective();
                                }
                            }}
                            placeholder="Add a specific objective..."
                        />
                        <Button
                            type="button"
                            label="Add"
                            icon="pi pi-plus"
                            onClick={handleAddSpecificObjective}
                            className="p-button-outlined"
                        />
                    </div>
                    {data.objectives?.specific && data.objectives.specific.length > 0 && (
                        <ul className="list-none p-0 m-0 surface-50 border-round p-2 border-1 surface-border">
                            {data.objectives.specific.map((obj, index) => (
                                <li key={index} className="flex align-items-center justify-content-between py-2 px-3 border-bottom-1 surface-border last:border-none">
                                    <span className="text-800 text-sm">
                                        <strong className="mr-2 text-primary">{index + 1}.</strong> {obj}
                                    </span>
                                    <Button
                                        icon="pi pi-trash"
                                        className="p-button-text p-button-danger p-button-sm"
                                        onClick={() => handleRemoveSpecificObjective(index)}
                                        tooltip="Remove objective"
                                        tooltipOptions={{ position: 'top' }}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
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