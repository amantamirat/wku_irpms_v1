'use client';

import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TreeSelect } from 'primereact/treeselect';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';

import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { CalendarApi } from '@/app/(main)/calendars/api/calendar.api';
import { ConstraintApi } from '@/app/(main)/grants/constraints/api/constraint.api';
import { UserApi } from '@/app/(main)/users/api/user.api'; // Ensure correct path for UserApi

import { Constraint } from '@/app/(main)/grants/constraints/models/constraint.model';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { GrantStatus } from '@/app/(main)/grants/models/grant.state-machine';
import { ThemeNode, buildTree } from '@/app/(main)/thematics/models/thematic.node';
import { Project } from '../../models/project.model';
import { Calendar } from '@/app/(main)/calendars/models/calendar.model';

interface BasicInfoStepProps {
    data: Project;
    onUpdate: (data: Partial<Project>) => void;
    onConstraintsChange: (constraints: Constraint[]) => void;
    onNext: () => void;
    isEditModeOnly?: boolean;
}

export const BasicInfoStep = ({ data, onUpdate, onConstraintsChange, onNext, isEditModeOnly }: BasicInfoStepProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [themeNodes, setThemeNodes] = useState<ThemeNode[]>([]);

    // --- Applicants State ---
    const [applicants, setApplicants] = useState<any[]>([]);
    const [loadingApplicants, setLoadingApplicants] = useState(false);

    // --- Load Applicants ---
    useEffect(() => {
        const fetchUsers = async () => {
            // Replaced `visible` with checking if component is in creation mode
            if (!isEditModeOnly) {
                setLoadingApplicants(true);
                try {
                    const data = await UserApi.getAll({});
                    // Handle response whether backend returns array directly or inside data property
                    setApplicants(data);
                } catch (err) {
                    console.error("Failed to fetch applicants:", err);
                } finally {
                    setLoadingApplicants(false);
                }
            }
        };
        fetchUsers();
    }, [isEditModeOnly]);

    // --- Load Active Grants & Calendars ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                if (!isEditModeOnly) {
                    const gData = await GrantApi.getAll({ status: GrantStatus.active, populate: true });
                    setGrants(gData);
                }

                const cData = await CalendarApi.getAll();
                setCalendars(cData || []);
            } catch (err) {
                console.error('Failed to load initial form data:', err);
            }
        };
        loadInitialData();
    }, [isEditModeOnly]);

    // --- Reactive Load: Fetch Themes & Constraints by Grant ID ---
    useEffect(() => {
        const handleGrantDependencies = async () => {
            if (!data.grant) {
                setThemeNodes([]);
                onConstraintsChange([]);
                return;
            }

            const grantId = typeof data.grant === 'object' ? (data.grant as any)?._id : data.grant;

            if (grantId) {
                try {
                    const fetchedConstraints = await ConstraintApi.getAll({ grant: grantId });
                    onConstraintsChange(fetchedConstraints || []);
                } catch (err) {
                    console.error('Failed to fetch constraints for grant:', err);
                    onConstraintsChange([]);
                }

                const fullGrantObject = grants.find(g => g._id === grantId) ||
                    (typeof data.grant === 'object' ? (data.grant as Grant) : null);

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
        handleGrantDependencies();
    }, [data.grant, grants]);

    // --- Applicant Selection Handler ---
    const selectedLeadApplicant = data.collaborators?.[0]?.applicant;
    const selectedLeadId = typeof selectedLeadApplicant === 'object' ? selectedLeadApplicant?._id : selectedLeadApplicant;

    const handleApplicantChange = (selectedUser: any) => {
        const existingCollaborators = data.collaborators || [];
        const currentLead = existingCollaborators[0] || {};
        const nonLeadCollaborators = existingCollaborators.slice(1);

        // Replace or set index 0 with isLeadPI set to true
        const updatedLead = {
            ...currentLead,
            applicant: selectedUser,
            isLeadPI: true,
        };

        onUpdate({
            collaborators: [updatedLead, ...nonLeadCollaborators]
        });
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

    const handleForward = () => {
        setSubmitted(true);
        if (
            !data.grant ||
            !data.calendar ||
            !data.title ||
            !data.themes ||
            data.themes.length === 0 ||
            !data.collaborators?.[0]?.applicant
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
                    {isEditModeOnly ? (
                        <InputText
                            value={typeof data.grant === 'object' ? (data.grant as any)?.title : 'Bound Grant Framework'}
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

                {/* Dynamic Lead Applicant Dropdown */}
                <div className="field col-12 md:col-6">
                    <label className="font-bold">Lead Applicant</label>
                    {isEditModeOnly ? (
                        <InputText
                            value={
                                (data.applicant as any)?.name ||
                                'Lead Profile'
                            }
                            disabled
                            className="surface-100"
                        />
                    ) : (
                        <Dropdown
                            value={selectedLeadId}
                            options={applicants}
                            onChange={(e) => handleApplicantChange(e.value)}
                            optionLabel="name" // Change to 'email' or 'fullName' to match your User entity
                            optionValue="_id"
                            filter
                            //loading={loadingApplicants}
                            placeholder="Select Lead Applicant"
                            className={classNames({ 'p-invalid': submitted && !data.collaborators?.[0]?.applicant })}
                        />
                    )}
                </div>
            </div>

            {/* Calendar Selection Dropdown */}
            <div className="field">
                <label htmlFor="calendar" className="font-bold">Project Calendar Framework</label>
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
                    placeholder={data.grant ? "Select one or more structural options" : "Please select a grant source first"}
                    disabled={!data.grant}
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