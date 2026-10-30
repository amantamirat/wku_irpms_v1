'use client';

import { format } from 'date-fns';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { TabPanel, TabView } from 'primereact/tabview';
import { classNames } from 'primereact/utils';
import { ReactNode, useEffect, useState } from 'react';

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
import ProjectForm from './ProjectForm';
import ProjectProgress from './ProjectProgress';
import ProjectComponentManager from '../project-components/components/ProjectComponentManager';

interface ProjectDetailProps {
    /** Project is loaded by the parent, this component never fetches it */
    project: Project;
    updateProject?: (project: Project) => void;
    useLookup?: boolean;
    disableCrud?: boolean;
    /** Hides the Collaborators tab, the collaborators metric and the lead PI */
    hideCollaborators?: boolean;
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

const InfoCard = ({
    icon,
    title,
    children,
    className
}: {
    icon: string;
    title: string;
    children: ReactNode;
    className?: string;
}) => (
    <div className={classNames('surface-card border-1 surface-border border-round-xl p-4 h-full', className)}>
        <div className="flex align-items-center gap-2 mb-3">
            <i className={classNames('pi text-primary', icon)} />
            <span className="text-xs font-bold text-600 uppercase">{title}</span>
        </div>
        {children}
    </div>
);

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

export default function ProjectDetail({
    project,
    updateProject,
    useLookup,
    disableCrud,
    hideCollaborators = false
}: ProjectDetailProps) {
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
            toast.success("'Your changes have been saved.'");


        } catch (err: any) {
            console.error('Failed to update project:', err);
            toast.error(err?.message || 'Could not save the project. Please try again.',);
        } finally {
            setSaving(false);
        }
    };

    /* --------------------------- derived data ----------------------- */
    const grantLabel = refLabel(projectData.grant, ['title', 'name']);
    const calendarLabel = refLabel(projectData.calendar, ['year', 'name']);
    const callLabel = refLabel(projectData.call, ['title', 'name']);
    const leadLabel = hideCollaborators ? null : refLabel(projectData.leadPI, ['name']);

    const objectives = projectData.objectives;
    const hasObjectives =
        !!objectives &&
        (!!objectives.general ||
            (objectives.specific?.length ?? 0) > 0 ||
            (objectives.expectedOutputs?.length ?? 0) > 0);

    const canEdit = !disableCrud && !!projectData._id && projectData.status === ProjectStatus.draft && hasPermission(['project:update:own']);

    const getPermission = (resource: string) => `${resource}:${useLookup ? 'lookup' : 'read'}`;

    /* ------------------------------ tabs ---------------------------- */
    const tabs: { header: string; icon: string; permission: string; content: ReactNode }[] = [];

    // Not even created when hidden, so the tab never mounts or loads
    if (!hideCollaborators) {
        tabs.push({
            header: 'Collaborators',
            icon: 'pi pi-users',
            permission: getPermission('collaborator'),
            content: (
                <CollaboratorManager project={projectData} useLookup={useLookup} disableCrud={disableCrud} />
            )
        });
    }

    tabs.push(
        {
            header: 'Phases',
            icon: MENU_ICONS.phases,
            permission: getPermission('phase'),
            content: <PhaseManager project={projectData} useLookup={useLookup} disableCrud={disableCrud} />
        },
        {
            header: 'Components',
            icon: MENU_ICONS.components,
            permission: getPermission('projectComponent'),
            content: <ProjectComponentManager project={projectData} useLookup={useLookup} disableCrud={disableCrud} />
        },
        {
            header: 'Activities',
            icon: MENU_ICONS.activities,
            permission: getPermission('phaseActivity'),
            content: <ActivityManager project={projectData} useLookup={useLookup} disableCrud={disableCrud} />
        },
        {
            header: 'Equipments',
            icon: MENU_ICONS.equipments,
            permission: getPermission('phaseEquipment'),
            content: <EquipmentManager project={projectData} useLookup={useLookup} disableCrud={disableCrud} />
        },
        {
            header: 'Documents',
            icon: MENU_ICONS.documents,
            permission: getPermission('phaseDocument'),
            content: (
                <PhaseDocumentManager project={projectData} useLookup={useLookup} disableCrud={disableCrud} />
            )
        }
    );

    if (projectData.call) {
        tabs.push({
            header: 'Applications',
            icon: MENU_ICONS.applications,
            permission: getPermission('application'),
            content: (
                <ApplicationManager project={projectData} useLookup={useLookup} disableCrud={disableCrud} />
            )
        });
    }

    if (projectData.currentVerification) {
        tabs.push({
            header: 'Verifications',
            icon: MENU_ICONS.verifications,
            permission: getPermission('verification'),
            content: <VerificationManager project={projectData} useLookup={useLookup} />
        });
    }

    tabs.push({
        header: 'Status History',
        icon: 'pi pi-history',
        permission: 'project:read',
        content: <StatusHistoryWidget history={projectData.statusHistory} />
    });

    const allowedTabs = tabs.filter((tab) => hasPermission([tab.permission]));

    /* ----------------------------- render --------------------------- */
    return (
        <div className="flex flex-column gap-3">

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

                    {!hideCollaborators && (
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
                <div className="grid m-0" style={{ margin: '-0.5rem' }}>
                    {projectData.summary && (
                        <div className={classNames('col-12 p-2', { 'lg:col-5': hasObjectives })}>
                            <InfoCard icon="pi-align-left" title="Abstract / Summary">
                                <p className="m-0 text-700 text-sm line-height-3 white-space-pre-line">
                                    {projectData.summary}
                                </p>
                            </InfoCard>
                        </div>
                    )}

                    {hasObjectives && (
                        <div className={classNames('col-12 p-2', { 'lg:col-7': !!projectData.summary })}>
                            <InfoCard icon="pi-compass" title="Goals, Objectives & Outputs">
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
                            </InfoCard>
                        </div>
                    )}
                </div>
            )}

            {/* PROGRESS */}
            {projectData._id && <ProjectProgress projectId={projectData._id} />}

            {/* TABS */}
            {allowedTabs.length > 0 && (
                <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-2">
                    <TabView renderActiveOnly>
                        {allowedTabs.map((tab) => (
                            <TabPanel key={tab.header} header={tab.header} leftIcon={`${tab.icon} mr-2`}>
                                <div className="pt-3 px-2 pb-2">{tab.content}</div>
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