'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
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

import { CallApi } from '@/app/(main)/calls/api/call.api';
import { Call } from '@/app/(main)/calls/models/call.model';

import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
import { GrantStatus } from '@/app/(main)/grants/models/grant.state-machine';

import {
    ThemeNode,
    buildTree
} from '@/app/(main)/thematics/models/thematic.node';
import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';

import { IProjectObjectives, Project } from '../models/project.model';

import { FieldError, FieldHint, FieldLabel, LockedField, SectionCard, StatCard } from '@/templates/FormPrimitives';
import { etbCurrencyFormatter, extractId, formatDuration, getReferenceName } from '@/utils/utils';

type ProjectFormProps = ItemFormRenderProps<Project> & {
    /** Do not render the "Project Setup" section at all (e.g. when reused for "apply for a call"). */
    hideSetup?: boolean;
    /** Render the setup section read-only. It is always locked on edit or when `item.call` is preset. */
    lockSetup?: boolean;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const createInitialProject = (item: Partial<Project> | null | undefined): Project => {
    // Strip legacy fields that this form no longer manages
    const {
        phases: _phases,
        collaborators: _collaborators,
        leadPI: _leadPI,
        ...rest
    } = (item ?? {}) as Partial<Project> & Record<string, unknown>;

    return {
        ...rest,
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
        totalBudget: item?.totalBudget,
        totalDuration: item?.totalDuration
    } as Project;
};

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

const ProjectForm = ({
    item,
    saving,
    formId,
    onSubmit,
    hideSetup = false,
    lockSetup = false
}: ProjectFormProps) => {
    const [project, setProject] = useState<Project>(() => createInitialProject(item));
    const [isCallProject, setIsCallProject] = useState<boolean>(Boolean(item?.call));

    const [submitted, setSubmitted] = useState(false);

    const [calls, setCalls] = useState<Call[]>([]);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [themeNodes, setThemeNodes] = useState<ThemeNode[]>([]);

    const [loadingCalls, setLoadingCalls] = useState(false);
    const [loadingGrants, setLoadingGrants] = useState(false);
    const [loadingCalendars, setLoadingCalendars] = useState(false);
    const [loadingThemes, setLoadingThemes] = useState(false);

    const [newSpecificObjective, setNewSpecificObjective] = useState('');
    const [newExpectedOutput, setNewExpectedOutput] = useState('');

    useEffect(() => {
        setProject(createInitialProject(item));
        setIsCallProject(Boolean(item?.call));
        setSubmitted(false);
        setNewSpecificObjective('');
        setNewExpectedOutput('');
    }, [item]);

    const isEdit = Boolean(item?._id);

    // Setup is immutable on edit, when a call is provided from outside, or when forced by the parent.
    const setupLocked = lockSetup || isEdit || Boolean(item?.call);

    const callId = extractId(project.call);
    const grantId = extractId(project.grant);
    const calendarId = extractId(project.calendar);

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
        // Nothing to pick when the setup is hidden or locked
        if (hideSetup || setupLocked) return;

        let cancelled = false;

        const loadLookups = async () => {
            if (isCallProject) {
                setLoadingCalls(true);
                try {
                    const result = CallApi.lookup ? await CallApi.lookup() : [];
                    if (!cancelled) setCalls(result || []);
                } catch (error) {
                    console.error('Failed to load calls:', error);
                } finally {
                    if (!cancelled) setLoadingCalls(false);
                }
                return;
            }

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

            setLoadingCalendars(true);
            try {
                const result = CalendarApi.lookup ? await CalendarApi.lookup() : [];
                if (!cancelled) setCalendars(result || []);
            } catch (error) {
                console.error('Failed to load calendars:', error);
            } finally {
                if (!cancelled) setLoadingCalendars(false);
            }
        };

        void loadLookups();

        return () => {
            cancelled = true;
        };
    }, [hideSetup, setupLocked, isCallProject]);

    /* ----------------------------- themes --------------------------- */
    // The grant (selected directly, or taken from the selected call) drives the available themes.
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
    const callLabel = getReferenceName(project.call, 'title', 'Bound Call');
    const grantLabel = getReferenceName(project.grant, 'title',
        isCallProject ? 'Defined by the selected call' : 'Bound Grant Framework'
    );
    const calendarLabel = getReferenceName(
        project.calendar,
        'year',
        isCallProject ? 'Defined by the selected call' : 'Bound Calendar Framework'
    );

    // Required by ProjectDto: totalBudget >= 0, totalDuration > 0
    const hasBudget = project.totalBudget != null && project.totalBudget >= 0;
    const hasDuration = project.totalDuration != null && project.totalDuration > 0;

    // Call project  -> call required (grant/calendar come from the call)
    // Grant project -> grant AND calendar required
    const setupChecks = isCallProject
        ? [{ label: 'Call', done: Boolean(callId) }]
        : [
            { label: 'Grant', done: Boolean(grantId) },
            { label: 'Calendar', done: Boolean(calendarId) }
        ];
    const setupValid = setupChecks.every((c) => c.done);

    const requiredChecks = [
        ...(hideSetup ? [] : setupChecks),
        { label: 'Title', done: Boolean(project.title?.trim()) },
        { label: 'Themes', done: Boolean(project.themes?.length) },
        { label: 'Budget', done: hasBudget },
        { label: 'Duration', done: hasDuration }
    ];
    const completed = requiredChecks.filter((c) => c.done).length;
    const percent = Math.round((completed / requiredChecks.length) * 100);

    const stepOffset = hideSetup ? 0 : 1;

    /* ----------------------------- handlers ------------------------- */
    const handleCallModeChange = (checked: boolean) => {
        setIsCallProject(checked);
        setProject((previous) => ({
            ...previous,
            call: undefined,
            grant: undefined,
            calendar: undefined,
            themes: []
        }));
    };

    const handleCallChange = (selected: Call | undefined) => {
        // grant & calendar are inherited from the call (read-only in the UI)
        setProject((previous) => ({
            ...previous,
            call: selected as Project['call'],
            grant: (selected as Call | undefined)?.grant as Project['grant'],
            calendar: (selected as Call | undefined)?.calendar as Project['calendar'],
            themes: []
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
            setupValid &&
            Boolean(project.themes?.length) &&
            hasBudget &&
            hasDuration;

        if (!isValid) return;

        await onSubmit({
            ...project,
            title: project.title.trim(),
            // DTO expects plain string ids, not populated objects.
            // Call project  -> only `call` is sent. Grant project -> `grant` + `calendar`.
            call: (isCallProject ? project.call : undefined) as Project['call'],
            grant: (isCallProject ? undefined : project.grant) as Project['grant'],
            calendar: (isCallProject ? undefined : project.calendar) as Project['calendar'],
            themes: (project.themes ?? []).map((t) => extractId(t)) as Project['themes'],
            totalBudget: project.totalBudget as number,
            totalDuration: project.totalDuration as number,
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
                            {isEdit ? 'Edit project' : 'New project'}
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

            {/* 1. Setup (optional) */}
            {!hideSetup && (
                <SectionCard
                    step={1}
                    icon="pi-id-card"
                    title="Project Setup"
                    description={
                        setupLocked
                            ? 'The setup is fixed and cannot be changed.'
                            : 'Link the project to a call, or to a grant and calendar.'
                    }
                >
                    <div className="formgrid grid">
                        {/* Call-project toggle (only while the setup can still be chosen) */}
                        {!setupLocked && (
                            <div className="field col-12">
                                <div className="flex align-items-center gap-2">
                                    <Checkbox
                                        inputId="project-is-call"
                                        checked={isCallProject}
                                        disabled={saving}
                                        onChange={(e) => handleCallModeChange(Boolean(e.checked))}
                                    />
                                    <label htmlFor="project-is-call" className="font-medium text-900">
                                        This project belongs to a call
                                    </label>
                                </div>
                                <small className="text-500 flex align-items-center gap-1 mt-2">
                                    <i className="pi pi-info-circle text-xs" />
                                    Grant and calendar are taken from the call. Otherwise choose them
                                    yourself.
                                </small>
                            </div>
                        )}

                        {/* Call */}
                        {isCallProject && (
                            <div className="field col-12">
                                <FieldLabel htmlFor="project-call" required>
                                    Call
                                </FieldLabel>

                                {setupLocked ? (
                                    <LockedField id="project-call" value={callLabel} />
                                ) : (
                                    <Dropdown
                                        inputId="project-call"
                                        value={callId || null}
                                        options={calls}
                                        optionLabel="title"
                                        optionValue="_id"
                                        filter
                                        showClear
                                        disabled={saving || loadingCalls}
                                        placeholder={loadingCalls ? 'Loading calls...' : 'Select a call'}
                                        emptyMessage="No calls found"
                                        onChange={(event) =>
                                            handleCallChange(
                                                calls.find((c) => c._id === event.value)
                                            )
                                        }
                                        className={classNames({ 'p-invalid': submitted && !callId })}
                                    />
                                )}

                                <FieldError show={submitted && !callId}>Select a call.</FieldError>
                            </div>
                        )}

                        {/* Grant */}
                        <div className="field col-12 md:col-6 mb-0">
                            <FieldLabel htmlFor="project-grant" required={!isCallProject}>
                                Grant Source
                            </FieldLabel>

                            {setupLocked || isCallProject ? (
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
                                            themes: []
                                        }));
                                    }}
                                    className={classNames({ 'p-invalid': submitted && !grantId })}
                                />
                            )}

                            <FieldError show={submitted && !isCallProject && !grantId}>
                                Select a grant source.
                            </FieldError>
                        </div>

                        {/* Calendar */}
                        <div className="field col-12 md:col-6 mb-0">
                            <FieldLabel htmlFor="project-calendar" required={!isCallProject}>
                                Project Calendar Framework
                            </FieldLabel>

                            {setupLocked || isCallProject ? (
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
                                    placeholder={
                                        loadingCalendars ? 'Loading calendars...' : 'Select calendar'
                                    }
                                    onChange={(event) => {
                                        const selected = calendars.find((c) => c._id === event.value);
                                        updateField('calendar', selected as Project['calendar']);
                                    }}
                                    className={classNames({ 'p-invalid': submitted && !calendarId })}
                                />
                            )}

                            <FieldError show={submitted && !isCallProject && !calendarId}>
                                Select a calendar framework.
                            </FieldError>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Core information */}
            <SectionCard
                step={1 + stepOffset}
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
                                ? isCallProject
                                    ? 'Select a call first'
                                    : 'Select a grant first'
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
                        Available thematic areas depend on the grant (or the grant of the selected call).
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

            {/* Budget & timeline */}
            <SectionCard
                step={2 + stepOffset}
                icon="pi-wallet"
                title="Budget & Timeline"
                description="Estimated total funding and duration of the project."
            >
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <StatCard icon="pi-money-bill" label="Total Budget" color="green" required>
                            <InputNumber
                                inputId="project-total-budget"
                                value={project.totalBudget ?? null}
                                onValueChange={(e) =>
                                    updateField(
                                        'totalBudget',
                                        (e.value ?? undefined) as Project['totalBudget']
                                    )
                                }
                                mode="currency"
                                currency="ETB"
                                locale="en-US"
                                min={0}
                                maxFractionDigits={2}
                                disabled={saving}
                                placeholder="0.00"
                                inputClassName={classNames('font-bold text-lg', {
                                    'p-invalid': submitted && !hasBudget
                                })}
                            />
                            <FieldError show={submitted && !hasBudget}>
                                Enter the total budget.
                            </FieldError>
                            <FieldHint>
                                {project.totalBudget
                                    ? `≈ ${etbCurrencyFormatter.format(project.totalBudget)}`
                                    : 'Total estimated cost of the project.'}
                            </FieldHint>
                        </StatCard>
                    </div>

                    <div className="col-12 md:col-6">
                        <StatCard
                            icon="pi-calendar-clock"
                            label="Total Duration"
                            color="blue"
                            required
                        >
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
                                inputClassName={classNames('font-bold text-lg', {
                                    'p-invalid': submitted && !hasDuration
                                })}
                            />
                            <FieldError show={submitted && !hasDuration}>
                                Duration must be greater than 0 days.
                            </FieldError>
                            <FieldHint>
                                {project.totalDuration
                                    ? `≈ ${formatDuration(project.totalDuration)}`
                                    : 'Total length of the project in days.'}
                            </FieldHint>
                        </StatCard>
                    </div>
                </div>
            </SectionCard>

            {/* Summary & objectives */}
            <SectionCard
                step={3 + stepOffset}
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
                        <Tag
                            value={objectives.expectedOutputs?.length ?? 0}
                            rounded
                            severity="success"
                        />
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