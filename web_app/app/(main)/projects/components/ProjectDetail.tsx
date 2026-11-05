'use client';

import { format } from 'date-fns';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { TabPanel, TabView } from 'primereact/tabview';
import { classNames } from 'primereact/utils';
import { ReactNode, useEffect, useId, useState } from 'react';

import { StatusHistoryWidget } from '@/components/StatusHistoryWidget';
import { useAuth } from '@/contexts/auth-context';
import MyBadge from '@/templates/MyBadge';
import { MENU_ICONS } from '@/utils/menu-icons';
import { etbCurrencyFormatter, extractId } from '@/utils/utils';

import { useToast } from '@/contexts/ToastContext';
import ApplicationManager from '../../applications/components/ApplicationManager';
import VerificationManager from '../../verifications/project/Manager';
import ActivityManager from '../activities/components/ActivityManager';
import { ProjectApi } from '../api/project.api';
import CollaboratorManager from '../collaborators/components/CollaboratorManager';
import EquipmentManager from '../equipments/components/EquipmentManager';
import { Project, ProjectStatus } from '../models/project.model';
import PhaseManager from '../phases/components/PhaseManager';
import PhaseDocumentManager from '../phases/documents/components/PhaseDocumentManager';
import ProjectComponentManager from '../project-components/components/ProjectComponentManager';
import ProjectForm from './ProjectForm';
import ProjectProgress from './ProjectProgress';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ProjectTabKey =
    | 'collaborators'
    | 'phases'
    | 'components'
    | 'activities'
    | 'equipments'
    | 'documents'
    | 'applications'
    | 'verifications'
    | 'statusHistory';

/** Settings that can be applied globally and overridden for each tab */
export interface ProjectTabOptions {
    useLookup?: boolean;
    disableCrud?: boolean;
    /** Removes the tab (and its related metric, if any) */
    hide?: boolean;
}

/** Single configuration object for ProjectDetail */
export interface ProjectDetailOptions extends Omit<ProjectTabOptions, 'hide'> {
    /** Hides the lead PI chip in the header (independent from the Collaborators tab) */
    hideLeadPI?: boolean;
    /** Per-tab overrides. Anything not set falls back to the global useLookup / disableCrud */
    tabs?: Partial<Record<ProjectTabKey, ProjectTabOptions>>;
}

interface ProjectDetailProps {
    /** Project is loaded by the parent, this component never fetches it */
    project: Project;
    updateProject?: (project: Project) => void;
    options?: ProjectDetailOptions;
}

interface TabContentProps {
    project: Project;
    useLookup?: boolean;
    disableCrud?: boolean;
}

interface TabDefinition {
    key: ProjectTabKey;
    header: string;
    icon: string;
    /** Resource used to build `<resource>:lookup|read`. Ignored when `permission` is set */
    resource?: string;
    /** Fixed permission (not affected by useLookup) */
    permission?: string;
    /** Extra condition for the tab to exist at all */
    when?: boolean;
    render: (props: TabContentProps) => ReactNode;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const REF_KEYS = ['grant', 'calendar', 'call', 'leadPI'] as const;

/** Returns a label only when the reference is a populated object, otherwise null (skip rendering) */
const refLabel = (field: unknown, keys: string[]): string | null => {
    if (!field || typeof field !== 'object') return null;
    const record = field as Record<string, unknown>;
    const key = keys.find((k) => record[k] != null && record[k] !== '');
    return key ? String(record[key]) : null;
};

const formatDuration = (totalDays?: number) => {
    if (!totalDays) return 'Not specified';
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    const parts: string[] = [];
    if (months > 0) parts.push(`${months}m`);
    if (days > 0 || months === 0) parts.push(`${days}d`);
    return parts.join(' ');
};

const countWords = (text?: string) => (text?.trim() ? text.trim().split(/\s+/).length : 0);

/**
 * The API may answer with ids instead of populated references.
 * Keep the populated object we already have when the id matches,
 * so chips don't disappear after an update.
 */
const mergeProject = (
    previous: Project,
    submitted: Partial<Project>,
    saved?: Partial<Project>
): Project => {
    const merged: any = { ...previous, ...submitted, ...(saved ?? {}) };

    REF_KEYS.forEach((key) => {
        if (merged[key] && typeof merged[key] !== 'object') {
            const candidate = [(submitted as any)[key], (previous as any)[key]].find(
                (c) => c && typeof c === 'object' && extractId(c) === merged[key]
            );
            if (candidate) merged[key] = candidate;
        }
    });

    return merged as Project;
};

/**
 * Scrollable tabs styling.
 * Tip: you can move this to your global stylesheet if you prefer.
 */
const TABS_CSS = `
.project-tabs .p-tabview-nav-container { position: relative; }
.project-tabs .p-tabview-nav-content { overflow-x: auto; scrollbar-width: thin; -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
.project-tabs .p-tabview-nav-content::-webkit-scrollbar { height: 4px; }
.project-tabs .p-tabview-nav-content::-webkit-scrollbar-thumb { background: var(--surface-300); border-radius: 4px; }
.project-tabs .p-tabview-nav { flex-wrap: nowrap; border-bottom: 1px solid var(--surface-border); }
.project-tabs .p-tabview-nav li { flex-shrink: 0; }
.project-tabs .p-tabview-nav li .p-tabview-nav-link { white-space: nowrap; font-weight: 600; font-size: 0.875rem; padding: 0.9rem 1.1rem; border-radius: 0.5rem 0.5rem 0 0; }
.project-tabs .p-tabview-nav li:not(.p-highlight):not(.p-disabled):hover .p-tabview-nav-link { background: var(--surface-100); }
.project-tabs .p-tabview-nav-btn.p-link { background: var(--surface-card); color: var(--primary-color); box-shadow: 0 0 12px rgba(0, 0, 0, 0.12); z-index: 2; width: 2.25rem; }
`;

/* ------------------------------------------------------------------ */
/* Presentational pieces                                               */
/* ------------------------------------------------------------------ */

const MetaChip = ({ icon, iconClass, label }: { icon: string; iconClass: string; label: string }) => (
    <span className="inline-flex align-items-center gap-2 px-3 py-2 border-round-2xl surface-100 text-700 text-sm font-medium">
        <i className={classNames('pi text-sm', icon, iconClass)} />
        {label}
    </span>
);

const StatTile = ({
    icon,
    label,
    color,
    children
}: {
    icon: string;
    label: string;
    color: string;
    children: ReactNode;
}) => (
    <div className="surface-card border-1 surface-border border-round-xl p-3 h-full flex align-items-center gap-3">
        <div
            className={classNames(
                'flex align-items-center justify-content-center border-round-lg flex-shrink-0',
                `bg-${color}-50 text-${color}-600`
            )}
            style={{ width: '2.75rem', height: '2.75rem' }}
        >
            <i className={classNames('pi text-xl', icon)} />
        </div>
        <div className="min-w-0">
            <span className="block text-500 text-xs font-bold uppercase mb-1">{label}</span>
            <div className="text-lg font-bold text-900 white-space-nowrap overflow-hidden text-overflow-ellipsis">
                {children}
            </div>
        </div>
    </div>
);

const CollapsibleCard = ({
    icon,
    title,
    defaultOpen = true,
    meta,
    children
}: {
    icon: string;
    title: string;
    defaultOpen?: boolean;
    /** Small text shown on the right of the header, useful when collapsed */
    meta?: string;
    children: ReactNode;
}) => {
    const [open, setOpen] = useState(defaultOpen);
    const contentId = useId();

    return (
        <div className="surface-card border-1 surface-border border-round-xl overflow-hidden">
            <button
                type="button"
                className="w-full flex align-items-center gap-2 p-4 border-none bg-transparent cursor-pointer text-left"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={() => setOpen((o) => !o)}
            >
                <i className={classNames('pi text-primary', icon)} />
                <span className="text-xs font-bold text-600 uppercase flex-1">{title}</span>
                {meta && <span className="text-xs text-500">{meta}</span>}
                <i className={classNames('pi text-500 text-sm', open ? 'pi-chevron-up' : 'pi-chevron-down')} />
            </button>

            {open && (
                <div id={contentId} className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    );
};

const NumberedList = ({ items }: { items: string[] }) => (
    <ul className="list-none p-0 m-0 flex flex-column gap-2">
        {items.map((text, i) => (
            <li key={i} className="flex align-items-start gap-2">
                <span
                    className="flex align-items-center justify-content-center bg-primary-50 text-primary font-bold border-circle flex-shrink-0"
                    style={{ width: '1.5rem', height: '1.5rem', fontSize: '0.7rem' }}
                >
                    {i + 1}
                </span>
                <span className="text-700 text-sm line-height-3">{text}</span>
            </li>
        ))}
    </ul>
);

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ProjectDetail({ project, updateProject, options = {} }: ProjectDetailProps) {
    const { useLookup, disableCrud, hideLeadPI = false, tabs: tabOptions } = options;

    const { hasPermission } = useAuth();
    const toast = useToast();

    const [projectData, setProjectData] = useState<Project>(project);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Keep in sync when the parent passes a new project
    useEffect(() => {
        setProjectData(project);
    }, [project]);

    const handleUpdateProject = (updated: Project) => {
        setProjectData(updated);
        updateProject?.(updated);
    };

    const handleEditSubmit = async (data: Partial<Project>) => {
        if (!projectData._id) return;

        try {
            setSaving(true);

            const saved = await ProjectApi.update({ ...data, _id: projectData._id });

            handleUpdateProject(mergeProject(projectData, data, saved as Partial<Project>));
            setEditing(false);
            toast.success('Your changes have been saved.');
        } catch (err: any) {
            console.error('Failed to update project:', err);
            toast.error(err?.message || 'Could not save the project. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    /** Per-tab value wins, otherwise the global one */
    const resolveTab = (key: ProjectTabKey) => ({
        useLookup: tabOptions?.[key]?.useLookup ?? useLookup,
        disableCrud: tabOptions?.[key]?.disableCrud ?? disableCrud,
        hide: tabOptions?.[key]?.hide ?? false
    });

    /* --------------------------- derived data ----------------------- */
    const grantLabel = refLabel(projectData.grant, ['title', 'name']);
    const calendarLabel = refLabel(projectData.calendar, ['year', 'name']);
    const callLabel = refLabel(projectData.call, ['title', 'name']);
    const leadLabel = hideLeadPI ? null : refLabel(projectData.leadPI, ['name']);

    const keywords = (projectData.keywords ?? []).map((k) => k.trim()).filter(Boolean);

    const summaryWords = countWords(projectData.summary);

    const objectives = projectData.objectives;
    const hasObjectives =
        !!objectives &&
        (!!objectives.general ||
            (objectives.specific?.length ?? 0) > 0 ||
            (objectives.expectedOutputs?.length ?? 0) > 0);

    const objectivesMeta = [
        (objectives?.specific?.length ?? 0) > 0 && `${objectives!.specific!.length} specific`,
        (objectives?.expectedOutputs?.length ?? 0) > 0 && `${objectives!.expectedOutputs!.length} outputs`
    ]
        .filter(Boolean)
        .join(' · ');

    const canEdit =
        !disableCrud &&
        !!projectData._id &&
        projectData.status === ProjectStatus.draft &&
        hasPermission(['project:update:own']);

    const showCollaboratorsMetric = !resolveTab('collaborators').hide;

    /* ------------------------------ tabs ---------------------------- */
    const tabDefinitions: TabDefinition[] = [
        {
            key: 'collaborators',
            header: 'Collaborators',
            icon: 'pi pi-users',
            resource: 'collaborator',
            render: (p) => <CollaboratorManager {...p} />
        },
        {
            key: 'phases',
            header: 'Phases',
            icon: MENU_ICONS.phases,
            resource: 'phase',
            render: (p) => <PhaseManager {...p} />
        },
        {
            key: 'components',
            header: 'Components',
            icon: MENU_ICONS.components,
            resource: 'projectComponent',
            render: (p) => <ProjectComponentManager {...p} />
        },
        {
            key: 'activities',
            header: 'Activities',
            icon: MENU_ICONS.activities,
            resource: 'phaseActivity',
            render: (p) => <ActivityManager {...p} />
        },
        {
            key: 'equipments',
            header: 'Equipments',
            icon: MENU_ICONS.equipments,
            resource: 'phaseEquipment',
            render: (p) => <EquipmentManager {...p} />
        },
        {
            key: 'documents',
            header: 'Documents',
            icon: MENU_ICONS.documents,
            resource: 'phaseDocument',
            render: (p) => <PhaseDocumentManager {...p} />
        },
        {
            key: 'applications',
            header: 'Applications',
            icon: MENU_ICONS.applications,
            resource: 'application',
            when: !!projectData.call,
            render: (p) => <ApplicationManager {...p} />
        },
        {
            key: 'verifications',
            header: 'Verifications',
            icon: MENU_ICONS.verifications,
            resource: 'verification',
            when: !!projectData.currentVerification,
            render: (p) => <VerificationManager project={p.project} useLookup={p.useLookup} />
        },
        {
            key: 'statusHistory',
            header: 'Status History',
            icon: 'pi pi-history',
            permission: 'project:read',
            render: (p) => <StatusHistoryWidget history={p.project.statusHistory} />
        }
    ];

    // Hidden tabs are never rendered, so they never mount or load
    const allowedTabs = tabDefinitions
        .filter((def) => def.when !== false)
        .map((def) => ({ def, opts: resolveTab(def.key) }))
        .filter(({ def, opts }) => {
            if (opts.hide) return false;
            const permission = def.permission ?? `${def.resource}:${opts.useLookup ? 'lookup' : 'read'}`;
            return hasPermission([permission]);
        });

    /* ----------------------------- render --------------------------- */
    return (
        <div className="flex flex-column gap-3">
            <style>{TABS_CSS}</style>

            {/* HEADER */}
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 overflow-hidden">
                <div
                    className="p-4"
                    style={{
                        background:
                            'linear-gradient(135deg, var(--primary-50, #eef2ff) 0%, var(--surface-0) 70%)'
                    }}
                >
                    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex align-items-center gap-2 mb-2">
                                <MyBadge type="status" value={projectData.status ?? 'Draft'} />
                            </div>

                            <h1 className="text-2xl font-bold m-0 mb-3 text-900 line-height-2">
                                {projectData.title || 'Untitled Project'}
                            </h1>

                            {(grantLabel || calendarLabel || callLabel || leadLabel) && (
                                <div className="flex flex-wrap gap-2">
                                    {grantLabel && (
                                        <MetaChip icon="pi-tag" iconClass="text-primary" label={grantLabel} />
                                    )}
                                    {calendarLabel && (
                                        <MetaChip icon="pi-calendar" iconClass="text-green-500" label={calendarLabel} />
                                    )}
                                    {callLabel && (
                                        <MetaChip icon="pi-megaphone" iconClass="text-orange-500" label={callLabel} />
                                    )}
                                    {leadLabel && (
                                        <MetaChip icon="pi-user" iconClass="text-blue-500" label={leadLabel} />
                                    )}
                                </div>
                            )}

                            {keywords.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {keywords.map((keyword) => (
                                        <span
                                            key={keyword}
                                            className="inline-flex align-items-center px-2 py-1 border-round-2xl bg-primary-50 text-primary text-xs font-medium"
                                        >
                                            # {keyword}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {canEdit && (
                            <Button
                                label="Edit project"
                                icon="pi pi-pencil"
                                outlined
                                className="flex-shrink-0 w-auto"
                                onClick={() => setEditing(true)}
                            />
                        )}
                    </div>
                </div>

                {/* METRICS */}
                <div className="grid m-0 p-2 surface-ground">
                    <div className="col-12 sm:col-6 lg:col-3 p-2">
                        <StatTile icon="pi-wallet" label="Project Budget" color="green">
                            {etbCurrencyFormatter.format(projectData.totalBudget ?? 0)}
                        </StatTile>
                    </div>

                    <div className="col-12 sm:col-6 lg:col-3 p-2">
                        <StatTile icon="pi-clock" label="Project Duration" color="blue">
                            {formatDuration(projectData.totalDuration)}
                        </StatTile>
                    </div>

                    {showCollaboratorsMetric && (
                        <div className="col-12 sm:col-6 lg:col-3 p-2">
                            <StatTile icon="pi-users" label="Collaborators" color="orange">
                                {projectData.totalCollabs ?? 0} Members
                            </StatTile>
                        </div>
                    )}

                    {projectData.createdAt && (
                        <div className="col-12 sm:col-6 lg:col-3 p-2">
                            <StatTile icon="pi-calendar-plus" label="Created On" color="purple">
                                {format(new Date(projectData.createdAt), 'PP')}
                            </StatTile>
                        </div>
                    )}
                </div>
            </div>

            {/* SUMMARY & OBJECTIVES */}
            {(projectData.summary || hasObjectives) && (
                <div className="grid m-0 align-items-start" style={{ margin: '-0.5rem' }}>
                    {projectData.summary && (
                        <div className={classNames('col-12 p-2', { 'lg:col-5': hasObjectives })}>
                            {/* collapsed by default */}
                            <CollapsibleCard
                                icon="pi-align-left"
                                title="Abstract / Summary"
                                defaultOpen={false}
                                meta={`${summaryWords} words`}
                            >
                                <p className="m-0 text-700 text-sm line-height-3 white-space-pre-line">
                                    {projectData.summary}
                                </p>
                            </CollapsibleCard>
                        </div>
                    )}

                    {hasObjectives && (
                        <div className={classNames('col-12 p-2', { 'lg:col-7': !!projectData.summary })}>
                            {/* collapsed by default */}
                            <CollapsibleCard
                                icon="pi-compass"
                                title="Goals, Objectives & Outputs"
                                defaultOpen={false}
                                meta={objectivesMeta}
                            >
                                <div className="flex flex-column gap-4">
                                    {objectives?.general && (
                                        <div className="p-3 border-round-lg bg-primary-50 border-left-3 border-primary">
                                            <span className="block text-xs font-bold text-primary uppercase mb-1">
                                                General Objective
                                            </span>
                                            <p className="m-0 text-800 text-sm line-height-3">{objectives.general}</p>
                                        </div>
                                    )}

                                    {(objectives?.specific?.length ?? 0) > 0 && (
                                        <div>
                                            <span className="block text-xs font-bold text-600 uppercase mb-2">
                                                Specific Objectives
                                            </span>
                                            <NumberedList items={objectives!.specific!} />
                                        </div>
                                    )}

                                    {(objectives?.expectedOutputs?.length ?? 0) > 0 && (
                                        <div>
                                            <span className="block text-xs font-bold text-600 uppercase mb-2">
                                                Expected Outputs
                                            </span>
                                            <NumberedList items={objectives!.expectedOutputs!} />
                                        </div>
                                    )}
                                </div>
                            </CollapsibleCard>
                        </div>
                    )}
                </div>
            )}

            {/* PROGRESS */}
            {projectData._id && <ProjectProgress projectId={projectData._id} />}

            {/* TABS */}
            {allowedTabs.length > 0 && (
                <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-2 project-tabs">
                    <TabView scrollable renderActiveOnly>
                        {allowedTabs.map(({ def, opts }) => (
                            <TabPanel key={def.key} header={def.header} leftIcon={`${def.icon} mr-2`}>
                                <div className="pt-3 px-2 pb-2">
                                    {def.render({
                                        project: projectData,
                                        useLookup: opts.useLookup,
                                        disableCrud: opts.disableCrud
                                    })}
                                </div>
                            </TabPanel>
                        ))}
                    </TabView>
                </div>
            )}

            {/* EDIT DIALOG */}
            <Dialog
                header="Edit project"
                visible={editing}
                modal
                draggable={false}
                style={{ width: '56rem', maxWidth: '95vw' }}
                onHide={() => !saving && setEditing(false)}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button
                            type="button"
                            label="Cancel"
                            icon="pi pi-times"
                            text
                            severity="secondary"
                            disabled={saving}
                            onClick={() => setEditing(false)}
                        />
                        <Button
                            type="submit"
                            form="project-detail-edit-form"
                            label={saving ? 'Saving...' : 'Save changes'}
                            icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                            disabled={saving}
                        />
                    </div>
                }
            >
                <ProjectForm
                    mode="edit"
                    item={projectData}
                    saving={saving}
                    formId="project-detail-edit-form"
                    onSubmit={handleEditSubmit}
                    onCancel={() => !saving && setEditing(false)}
                />
            </Dialog>
        </div>
    );
}