'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';

import { Button } from 'primereact/button';
import { Chips } from 'primereact/chips';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { TreeSelect, TreeSelectChangeEvent } from 'primereact/treeselect';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';

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

import {
    IProjectObjectives,
    Project
} from '../models/project.model';

import { extractId } from '@/utils/utils';

type ProjectFormProps = ItemFormRenderProps<Project>;

interface UserOption {
    _id: string;
    name: string;
    [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const createInitialProject = (
    item: Partial<Project> | null | undefined
): Project =>
    ({
        ...item,
        title: item?.title ?? '',
        summary: item?.summary ?? '',
        keywords: item?.keywords ?? [],
        themes: item?.themes ?? [],
        objectives: {
            general: '',
            specific: [],
            expectedOutputs: [],
            ...item?.objectives
        },
        collaborators: item?.collaborators ?? [],
        phases: item?.phases ?? [],
        totalBudget: item?.totalBudget,
        totalDuration: item?.totalDuration
    }) as Project;

const getReferenceName = (
    value: unknown,
    property: 'title' | 'year' | 'name',
    fallback: string
): string => {
    if (!value || typeof value !== 'object') return fallback;

    const record = value as Record<string, unknown>;
    return record[property] != null ? String(record[property]) : fallback;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0
    }).format(value);

/* ------------------------------------------------------------------ */
/* Presentational pieces                                               */
/* ------------------------------------------------------------------ */

const SectionCard = ({
    step,
    icon,
    title,
    description,
    children
}: {
    step: number;
    icon: string;
    title: string;
    description: string;
    children: ReactNode;
}) => (
    <section className="surface-card border-1 surface-border border-round-xl shadow-1 overflow-hidden">
        <div
            className="flex align-items-center gap-3 px-4 py-3 border-bottom-1 surface-border"
            style={{
                background:
                    'linear-gradient(135deg, var(--primary-50, #eef2ff) 0%, var(--surface-0) 100%)'
            }}
        >
            <div
                className="flex align-items-center justify-content-center bg-primary text-white border-round-lg flex-shrink-0 relative"
                style={{ width: '2.75rem', height: '2.75rem' }}
            >
                <i className={classNames('pi text-xl', icon)} />
                <span
                    className="absolute flex align-items-center justify-content-center surface-0 text-primary font-bold border-circle border-1 border-primary"
                    style={{
                        width: '1.2rem',
                        height: '1.2rem',
                        fontSize: '0.65rem',
                        top: '-0.4rem',
                        right: '-0.4rem'
                    }}
                >
                    {step}
                </span>
            </div>
            <div className="min-w-0">
                <h3 className="text-lg font-semibold m-0 text-900">{title}</h3>
                <p className="text-sm text-500 m-0 mt-1">{description}</p>
            </div>
        </div>

        <div className="p-4">{children}</div>
    </section>
);

const LockedField = ({ id, value }: { id: string; value: string }) => (
    <span className="p-input-icon-right w-full">
        <i className="pi pi-lock text-500" />
        <InputText id={id} value={value} disabled />
    </span>
);

const FieldLabel = ({
    htmlFor,
    required,
    children
}: {
    htmlFor: string;
    required?: boolean;
    children: ReactNode;
}) => (
    <label htmlFor={htmlFor} className="font-medium text-900 mb-2 block">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

const FieldError = ({ show, children }: { show: boolean; children: ReactNode }) =>
    show ? (
        <small className="p-error flex align-items-center gap-1 mt-1">
            <i className="pi pi-exclamation-circle text-xs" />
            {children}
        </small>
    ) : null;

const StatCard = ({
    icon,
    label,
    color,
    children
}: {
    icon: string;
    label: string;
    color: 'green' | 'blue';
    children: ReactNode;
}) => (
    <div
        className={classNames(
            'p-3 border-round-lg border-1 h-full',
            color === 'green' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
        )}
    >
        <div className="flex align-items-center gap-2 mb-3">
            <i
                className={classNames(
                    'pi',
                    icon,
                    color === 'green' ? 'text-green-600' : 'text-blue-600'
                )}
            />
            <span
                className={classNames(
                    'text-sm font-semibold uppercase',
                    color === 'green' ? 'text-green-700' : 'text-blue-700'
                )}
            >
                {label}
            </span>
        </div>
        {children}
    </div>
);

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

const ProjectForm = ({ item, saving, formId, onSubmit }: ProjectFormProps) => {
    const [project, setProject] = useState<Project>(() => createInitialProject(item));

    const [submitted, setSubmitted] = useState(false);

    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [themeNodes, setThemeNodes] = useState<ThemeNode[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);

    const [loadingGrants, setLoadingGrants] = useState(false);
    const [loadingCalendars, setLoadingCalendars] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingThemes, setLoadingThemes] = useState(false);

    const [newSpecificObjective, setNewSpecificObjective] = useState('');
    const [newExpectedOutput, setNewExpectedOutput] = useState('');

    useEffect(() => {
        setProject(createInitialProject(item));
        setSubmitted(false);
        setNewSpecificObjective('');
        setNewExpectedOutput('');
    }, [item]);

    const grantId = extractId(project.grant);
    const calendarId = extractId(project.calendar);

    const isGrantLocked = Boolean(project.call);
    const isCalendarLocked = Boolean(project.call);
    const isLeadLocked = Boolean(project.call) || project.lockLead === true;

    const objectives: IProjectObjectives = project.objectives ?? {
        general: '',
        specific: [],
        expectedOutputs: []
    };

    const updateField = <K extends keyof Project>(field: K, value: Project[K]) => {
        setProject((previous) => ({ ...previous, [field]: value }));
    };

    const updateObjectives = (patch: Partial<IProjectObjectives>) => {
        setProject((previous) => ({
            ...previous,
            objectives: {
                general: '',
                specific: [],
                expectedOutputs: [],
                ...previous.objectives,
                ...patch
            }
        }));
    };

    /* ---------------------------- lookups --------------------------- */
    useEffect(() => {
        let cancelled = false;

        const loadLookups = async () => {
            if (!isGrantLocked) {
                setLoadingGrants(true);
                try {
                    const result = GrantApi.lookup
                        ? await GrantApi.lookup({ status: GrantStatus.active })
                        : [];
                    if (!cancelled) setGrants(result || []);
                } catch (error) {
                    console.error('Failed to load grants:', error);
                } finally {
                    if (!cancelled) setLoadingGrants(false);
                }
            }

            if (!isCalendarLocked) {
                setLoadingCalendars(true);
                try {
                    const result = CalendarApi.lookup ? await CalendarApi.lookup() : [];
                    if (!cancelled) setCalendars(result || []);
                } catch (error) {
                    console.error('Failed to load calendars:', error);
                } finally {
                    if (!cancelled) setLoadingCalendars(false);
                }
            }

            if (!isLeadLocked) {
                setLoadingUsers(true);
                try {
                    const result = UserApi.lookup ? await UserApi.lookup() : [];
                    if (!cancelled) setUsers((result || []) as UserOption[]);
                } catch (error) {
                    console.error('Failed to load applicants:', error);
                } finally {
                    if (!cancelled) setLoadingUsers(false);
                }
            }
        };

        void loadLookups();

        return () => {
            cancelled = true;
        };
    }, [isGrantLocked, isCalendarLocked, isLeadLocked]);

    /* ----------------------------- themes --------------------------- */
    useEffect(() => {
        let cancelled = false;

        const loadThemes = async () => {
            if (!grantId) {
                setThemeNodes([]);
                return;
            }

            setLoadingThemes(true);

            try {
                let grant: Grant | null = null;

                if (project.grant && typeof project.grant === 'object') {
                    grant = project.grant as Grant;
                } else if (GrantApi.getById) {
                    grant = await GrantApi.getById(grantId);
                }

                if (cancelled) return;

                const thematicId = grant?.thematic ? extractId(grant.thematic) : '';

                if (!thematicId || !ThemeApi.lookup) {
                    setThemeNodes([]);
                    return;
                }

                const result = await ThemeApi.lookup({ thematicArea: thematicId });

                if (!cancelled) setThemeNodes(buildTree(result || []));
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to load themes:', error);
                    setThemeNodes([]);
                }
            } finally {
                if (!cancelled) setLoadingThemes(false);
            }
        };

        void loadThemes();

        return () => {
            cancelled = true;
        };
    }, [grantId, project.grant]);

    /* ------------------------- derived values ----------------------- */
    const selectedLeadMember = project.collaborators?.[0]?.member;
    const selectedLeadId = extractId(selectedLeadMember || project.leadPI);

    const selectedLeadName = useMemo(() => {
        const lead =
            project.leadPI && typeof project.leadPI === 'object'
                ? project.leadPI
                : selectedLeadMember && typeof selectedLeadMember === 'object'
                    ? selectedLeadMember
                    : null;

        return getReferenceName(lead, 'name', 'Lead PI Profile');
    }, [project.leadPI, selectedLeadMember]);

    const grantLabel = getReferenceName(project.grant, 'title', 'Bound Grant Framework');
    const calendarLabel = getReferenceName(project.calendar, 'year', 'Bound Calendar Framework');

    // Totals computed from phases (SubmissionStep uses these when phases exist)
    const phasesBudget = useMemo(
        () => (project.phases ?? []).reduce((s, p: any) => s + (Number(p?.budget) || 0), 0),
        [project.phases]
    );
    const phasesDuration = useMemo(
        () => (project.phases ?? []).reduce((s, p: any) => s + (Number(p?.duration) || 0), 0),
        [project.phases]
    );
    const hasPhases = (project.phases?.length ?? 0) > 0;

    const hasLead = Boolean(project.collaborators?.[0]?.member || project.leadPI);

    const requiredChecks = [
        { label: 'Grant', done: Boolean(grantId) },
        { label: 'Lead PI', done: hasLead },
        { label: 'Calendar', done: Boolean(calendarId) },
        { label: 'Title', done: Boolean(project.title?.trim()) },
        { label: 'Themes', done: Boolean(project.themes?.length) }
    ];
    const completed = requiredChecks.filter((c) => c.done).length;
    const percent = Math.round((completed / requiredChecks.length) * 100);

    /* ----------------------------- handlers ------------------------- */
    const handleLeadChange = (userId: string) => {
        const selectedUser = users.find((user) => user._id === userId);
        if (!selectedUser) return;

        const collaborators = project.collaborators ?? [];
        const currentLead = collaborators[0] ?? {};

        setProject((previous) => ({
            ...previous,
            leadPI: selectedUser as Project['leadPI'],
            collaborators: [
                {
                    ...currentLead,
                    member: selectedUser,
                    role: currentLead.role || 'Lead PI',
                    isLeadPI: true
                },
                ...collaborators.slice(1)
            ] as Project['collaborators']
        }));
    };

    const getThemeSelectionKeys = () => {
        const selection: Record<string, { checked: boolean; partialChecked: boolean }> = {};

        (project.themes ?? []).forEach((theme) => {
            const id = extractId(theme);
            if (id) selection[id] = { checked: true, partialChecked: false };
        });

        return selection;
    };

    const handleThemeChange = (event: TreeSelectChangeEvent) => {
        const value = event.value;

        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            updateField('themes', [] as Project['themes']);
            return;
        }

        const selectedIds = Object.entries(value)
            .filter(
                ([, selection]) =>
                    typeof selection === 'object' &&
                    selection !== null &&
                    'checked' in selection &&
                    selection.checked === true
            )
            .map(([id]) => id);

        updateField('themes', selectedIds as Project['themes']);
    };

    const addSpecificObjective = () => {
        const value = newSpecificObjective.trim();
        if (!value) return;
        updateObjectives({ specific: [...(objectives.specific ?? []), value] });
        setNewSpecificObjective('');
    };

    const removeSpecificObjective = (index: number) => {
        updateObjectives({
            specific: (objectives.specific ?? []).filter((_, i) => i !== index)
        });
    };

    const addExpectedOutput = () => {
        const value = newExpectedOutput.trim();
        if (!value) return;
        updateObjectives({ expectedOutputs: [...(objectives.expectedOutputs ?? []), value] });
        setNewExpectedOutput('');
    };

    const removeExpectedOutput = (index: number) => {
        updateObjectives({
            expectedOutputs: (objectives.expectedOutputs ?? []).filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitted(true);

        if (saving) return;

        const isValid =
            Boolean(project.title?.trim()) &&
            Boolean(grantId) &&
            Boolean(calendarId) &&
            Boolean(project.themes?.length) &&
            hasLead;

        if (!isValid) return;

        await onSubmit({
            ...project,
            title: project.title.trim(),
            totalBudget: project.totalBudget ?? undefined,
            totalDuration: project.totalDuration ?? undefined,
            objectives: {
                general: objectives.general ?? '',
                specific: objectives.specific ?? [],
                expectedOutputs: objectives.expectedOutputs ?? []
            }
        });
    };

    /* --------------------------- list renderer ---------------------- */
    const renderStringList = (
        title: string,
        values: string[],
        onRemove: (index: number) => void,
        emptyMessage: string,
        icon: string
    ) => (
        <div className="surface-ground border-1 border-dashed surface-border border-round-lg p-2">
            {values.length === 0 ? (
                <div className="flex flex-column align-items-center text-500 py-3">
                    <i className={classNames('pi text-2xl mb-2', icon)} />
                    <small>{emptyMessage}</small>
                </div>
            ) : (
                <ul className="list-none p-0 m-0 flex flex-column gap-2">
                    {values.map((value, index) => (
                        <li
                            key={`${title}-${index}`}
                            className="flex align-items-center gap-3 p-2 pl-3 surface-card border-1 surface-border border-round-lg"
                        >
                            <span
                                className="flex align-items-center justify-content-center bg-primary-50 text-primary font-bold border-circle flex-shrink-0 text-sm"
                                style={{ width: '1.75rem', height: '1.75rem' }}
                            >
                                {index + 1}
                            </span>
                            <span className="flex-1 text-sm text-900 line-height-3">{value}</span>
                            <Button
                                type="button"
                                icon="pi pi-trash"
                                severity="danger"
                                text
                                rounded
                                size="small"
                                disabled={saving}
                                onClick={() => onRemove(index)}
                                aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    /* ------------------------------ render -------------------------- */
    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid flex flex-column gap-4"
            noValidate
        >
            {/* Progress header */}
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-4">
                <div className="flex align-items-center justify-content-between mb-3">
                    <div>
                        <div className="font-semibold text-900">
                            {item?._id ? 'Edit project' : 'New project'}
                        </div>
                        <small className="text-500">
                            {completed === requiredChecks.length
                                ? 'All required information is filled in.'
                                : `${requiredChecks.length - completed} required field${requiredChecks.length - completed > 1 ? 's' : ''
                                } left`}
                        </small>
                    </div>
                    <Tag
                        value={`${percent}%`}
                        severity={percent === 100 ? 'success' : 'info'}
                        rounded
                    />
                </div>

                <ProgressBar value={percent} showValue={false} style={{ height: '6px' }} />

                <div className="flex flex-wrap gap-2 mt-3">
                    {requiredChecks.map((check) => (
                        <span
                            key={check.label}
                            className={classNames(
                                'inline-flex align-items-center gap-1 px-2 py-1 border-round-2xl text-xs font-medium',
                                check.done ? 'bg-green-50 text-green-700' : 'surface-100 text-500'
                            )}
                        >
                            <i
                                className={classNames(
                                    'pi text-xs',
                                    check.done ? 'pi-check-circle' : 'pi-circle'
                                )}
                            />
                            {check.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* 1. Setup */}
            <SectionCard
                step={1}
                icon="pi-id-card"
                title="Project Setup & Leadership"
                description="Funding framework, academic calendar, and principal investigator."
            >
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <FieldLabel htmlFor="project-grant" required>
                            Grant Source
                        </FieldLabel>

                        {isGrantLocked ? (
                            <LockedField id="project-grant" value={grantLabel} />
                        ) : (
                            <Dropdown
                                inputId="project-grant"
                                value={grantId || null}
                                options={grants}
                                optionLabel="title"
                                optionValue="_id"
                                filter
                                showClear
                                disabled={saving || loadingGrants}
                                placeholder={
                                    loadingGrants ? 'Loading grants...' : 'Select an active grant'
                                }
                                onChange={(event) => {
                                    const selected = grants.find((g) => g._id === event.value);

                                    setProject((previous) => ({
                                        ...previous,
                                        grant: selected as Project['grant'],
                                        themes: [],
                                        phases: [],
                                        collaborators: previous.collaborators?.slice(0, 1) ?? []
                                    }));
                                }}
                                className={classNames({ 'p-invalid': submitted && !grantId })}
                            />
                        )}

                        <FieldError show={submitted && !grantId}>Select a grant source.</FieldError>
                    </div>

                    <div className="field col-12 md:col-6">
                        <FieldLabel htmlFor="project-lead" required>
                            Lead Principal Investigator
                        </FieldLabel>

                        {isLeadLocked ? (
                            <LockedField id="project-lead" value={selectedLeadName} />
                        ) : (
                            <Dropdown
                                inputId="project-lead"
                                value={selectedLeadId || null}
                                options={users}
                                optionLabel="name"
                                optionValue="_id"
                                filter
                                showClear
                                disabled={saving || loadingUsers}
                                placeholder={loadingUsers ? 'Loading applicants...' : 'Select lead PI'}
                                emptyMessage="No applicants found"
                                onChange={(event) => {
                                    if (event.value) handleLeadChange(event.value);
                                }}
                                className={classNames({ 'p-invalid': submitted && !selectedLeadId })}
                            />
                        )}

                        <FieldError show={submitted && !selectedLeadId}>
                            Select a lead principal investigator.
                        </FieldError>
                    </div>

                    <div className="field col-12 mb-0">
                        <FieldLabel htmlFor="project-calendar" required>
                            Project Calendar Framework
                        </FieldLabel>

                        {isCalendarLocked ? (
                            <LockedField id="project-calendar" value={calendarLabel} />
                        ) : (
                            <Dropdown
                                inputId="project-calendar"
                                value={calendarId || null}
                                options={calendars}
                                optionLabel="year"
                                optionValue="_id"
                                filter
                                showClear
                                disabled={saving || loadingCalendars}
                                placeholder="Select calendar"
                                onChange={(event) => {
                                    const selected = calendars.find((c) => c._id === event.value);
                                    updateField('calendar', (selected ?? null) as Project['calendar']);
                                }}
                                className={classNames({ 'p-invalid': submitted && !calendarId })}
                            />
                        )}

                        <FieldError show={submitted && !calendarId}>
                            Select a calendar framework.
                        </FieldError>
                    </div>
                </div>
            </SectionCard>

            {/* 2. Core information */}
            <SectionCard
                step={2}
                icon="pi-file-edit"
                title="Core Information"
                description="Project title, thematic focus, and searchable keywords."
            >
                <div className="field">
                    <FieldLabel htmlFor="project-title" required>
                        Project Title
                    </FieldLabel>

                    <InputText
                        id="project-title"
                        value={project.title ?? ''}
                        maxLength={500}
                        disabled={saving}
                        placeholder="Enter a concise project title"
                        onChange={(event) => updateField('title', event.target.value)}
                        className={classNames({ 'p-invalid': submitted && !project.title?.trim() })}
                    />

                    <div className="flex justify-content-between">
                        <FieldError show={submitted && !project.title?.trim()}>
                            Project title is required.
                        </FieldError>
                        <small className="text-400 ml-auto mt-1">
                            {(project.title ?? '').length}/500
                        </small>
                    </div>
                </div>

                <div className="field mt-3">
                    <FieldLabel htmlFor="project-themes" required>
                        Thematic Focus Areas
                    </FieldLabel>

                    <TreeSelect
                        inputId="project-themes"
                        value={getThemeSelectionKeys()}
                        options={themeNodes}
                        onChange={handleThemeChange}
                        display="chip"
                        selectionMode="checkbox"
                        filter
                        disabled={saving || !grantId || loadingThemes}
                        placeholder={
                            !grantId
                                ? 'Select a grant first'
                                : loadingThemes
                                    ? 'Loading thematic areas...'
                                    : 'Select thematic areas'
                        }
                        className={classNames('w-full', {
                            'p-invalid': submitted && !project.themes?.length
                        })}
                        scrollHeight="250px"
                    />

                    <FieldError show={submitted && !project.themes?.length}>
                        Select at least one thematic focus area.
                    </FieldError>

                    <small className="text-500 flex align-items-center gap-1 mt-2">
                        <i className="pi pi-info-circle text-xs" />
                        Available thematic areas depend on the selected grant.
                    </small>
                </div>

                <div className="field mt-3 mb-0">
                    <FieldLabel htmlFor="project-keywords">Keywords / Tags</FieldLabel>

                    <Chips
                        inputId="project-keywords"
                        value={project.keywords ?? []}
                        onChange={(event) =>
                            updateField('keywords', (event.value ?? []) as Project['keywords'])
                        }
                        disabled={saving}
                        placeholder="Type a keyword and press Enter"
                        className="w-full"
                    />

                    <small className="text-500 flex align-items-center gap-1 mt-2">
                        <i className="pi pi-info-circle text-xs" />
                        Keywords help categorize and discover projects.
                    </small>
                </div>
            </SectionCard>

            {/* 3. Budget & timeline */}
            <SectionCard
                step={3}
                icon="pi-wallet"
                title="Budget & Timeline"
                description="Estimated total funding and duration of the project."
            >
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <StatCard icon="pi-money-bill" label="Total Budget" color="green">
                            <InputNumber
                                inputId="project-total-budget"
                                value={project.totalBudget ?? null}
                                onValueChange={(e) =>
                                    updateField('totalBudget', (e.value ?? undefined) as Project['totalBudget'])
                                }
                                mode="currency"
                                currency="ETB"
                                locale="en-US"
                                min={0}
                                maxFractionDigits={2}
                                disabled={saving}
                                placeholder="0.00"
                                inputClassName="font-bold text-lg"
                            />
                            <small className="text-green-700 block mt-2">
                                {project.totalBudget
                                    ? `≈ ${formatCurrency(project.totalBudget)}`
                                    : 'Total estimated cost of the project.'}
                            </small>
                        </StatCard>
                    </div>

                    <div className="col-12 md:col-6">
                        <StatCard icon="pi-calendar-clock" label="Total Duration" color="blue">
                            <InputNumber
                                inputId="project-total-duration"
                                value={project.totalDuration ?? null}
                                onValueChange={(e) =>
                                    updateField(
                                        'totalDuration',
                                        (e.value ?? undefined) as Project['totalDuration']
                                    )
                                }
                                min={0}
                                useGrouping={false}
                                suffix=" days"
                                disabled={saving}
                                placeholder="0 days"
                                inputClassName="font-bold text-lg"
                            />
                            <small className="text-blue-700 block mt-2">
                                {project.totalDuration
                                    ? `≈ ${(project.totalDuration / 30).toFixed(1)} months`
                                    : 'Total length of the project in days.'}
                            </small>
                        </StatCard>
                    </div>

                    {hasPhases && (
                        <div className="col-12">
                            <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-2 p-3 border-round-lg surface-50 border-1 surface-border">
                                <small className="text-600">
                                    <i className="pi pi-sitemap mr-2 text-primary" />
                                    Your phases add up to <strong>{formatCurrency(phasesBudget)}</strong> and{' '}
                                    <strong>{phasesDuration} days</strong>. When phases exist, these totals are
                                    used on submission.
                                </small>
                                <Button
                                    type="button"
                                    label="Use phase totals"
                                    icon="pi pi-refresh"
                                    size="small"
                                    outlined
                                    disabled={saving}
                                    className="w-auto flex-shrink-0"
                                    onClick={() =>
                                        setProject((prev) => ({
                                            ...prev,
                                            totalBudget: phasesBudget,
                                            totalDuration: phasesDuration
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* 4. Summary & objectives */}
            <SectionCard
                step={4}
                icon="pi-compass"
                title="Summary & Objectives"
                description="Describe the purpose, specific objectives, and expected outputs."
            >
                <div className="field">
                    <FieldLabel htmlFor="project-summary">Description / Summary / Abstract</FieldLabel>

                    <InputTextarea
                        id="project-summary"
                        value={project.summary ?? ''}
                        onChange={(event) => updateField('summary', event.target.value)}
                        rows={4}
                        autoResize
                        disabled={saving}
                        placeholder="Provide a concise summary of the project..."
                    />
                </div>

                <div className="field mt-3">
                    <FieldLabel htmlFor="project-general-objective">General Objective</FieldLabel>

                    <InputTextarea
                        id="project-general-objective"
                        value={objectives.general ?? ''}
                        onChange={(event) => updateObjectives({ general: event.target.value })}
                        rows={3}
                        autoResize
                        disabled={saving}
                        placeholder="State the primary goal of the project..."
                    />
                </div>

                {/* Specific objectives */}
                <div className="field mt-4">
                    <div className="flex align-items-center justify-content-between mb-2">
                        <label htmlFor="new-specific-objective" className="font-medium text-900">
                            Specific Objectives
                        </label>
                        <Tag value={objectives.specific?.length ?? 0} rounded severity="info" />
                    </div>

                    <div className="flex flex-column sm:flex-row gap-2 mb-3">
                        <InputText
                            id="new-specific-objective"
                            value={newSpecificObjective}
                            onChange={(event) => setNewSpecificObjective(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addSpecificObjective();
                                }
                            }}
                            disabled={saving}
                            placeholder="Add a specific objective and press Enter..."
                        />

                        <Button
                            type="button"
                            label="Add"
                            icon="pi pi-plus"
                            disabled={saving || !newSpecificObjective.trim()}
                            onClick={addSpecificObjective}
                            className="sm:w-auto flex-shrink-0"
                        />
                    </div>

                    {renderStringList(
                        'Specific objective',
                        objectives.specific ?? [],
                        removeSpecificObjective,
                        'No specific objectives added yet.',
                        'pi-bullseye'
                    )}
                </div>

                {/* Expected outputs */}
                <div className="field mt-4 mb-0">
                    <div className="flex align-items-center justify-content-between mb-2">
                        <label htmlFor="new-expected-output" className="font-medium text-900">
                            Expected Outputs
                        </label>
                        <Tag value={objectives.expectedOutputs?.length ?? 0} rounded severity="success" />
                    </div>

                    <div className="flex flex-column sm:flex-row gap-2 mb-3">
                        <InputText
                            id="new-expected-output"
                            value={newExpectedOutput}
                            onChange={(event) => setNewExpectedOutput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addExpectedOutput();
                                }
                            }}
                            disabled={saving}
                            placeholder="Add an expected output and press Enter..."
                        />

                        <Button
                            type="button"
                            label="Add"
                            icon="pi pi-plus"
                            disabled={saving || !newExpectedOutput.trim()}
                            onClick={addExpectedOutput}
                            className="sm:w-auto flex-shrink-0"
                        />
                    </div>

                    {renderStringList(
                        'Expected output',
                        objectives.expectedOutputs ?? [],
                        removeExpectedOutput,
                        'No expected outputs added yet.',
                        'pi-box'
                    )}
                </div>
            </SectionCard>
        </form>
    );
};

export default ProjectForm;