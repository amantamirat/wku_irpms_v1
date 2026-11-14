'use client';

import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { classNames } from 'primereact/utils';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { ItemFormRenderProps } from '@/components/ItemManager';

import { Project } from '@/app/(main)/projects/models/project.model';

import { extractId } from '@/utils/utils';
import { CollaboratorApi } from '../../collaborators/api/collaborator.api';
                   // adjust path
import { ProjectComponentDTO } from '../models/component.model';
import { ActivityApi } from '../../activities/api/phase-activity.api';
import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import { Theme } from '@/app/(main)/thematics/themes/models/theme.model';

interface ProjectComponentFormProps
    extends ItemFormRenderProps<ProjectComponentDTO> {
    project?: Project | string | null;
}

type Option = { label: string; value: string };

// ---------- helpers ----------

const idOf = (x: any): string => String(extractId(x) ?? '');

const labelOf = (x: any, fallback: string): string =>
    x && typeof x === 'object'
        ? String(x.name ?? x.title ?? x.email ?? fallback)
        : fallback;

// Unique, non-empty IDs
const uniqueIds = (list: any[] = []): string[] =>
    [...new Set(list.map(idOf).filter(Boolean))];

/**
 * Build unique { label, value } options from the loaded items, plus any
 * currently selected items (so selected chips always have a matching option).
 */
const buildOptions = (loaded: any[] = [], selected: any[] = []): Option[] => {
    const map = new Map<string, Option>();

    [...loaded, ...selected].forEach((x) => {
        const id = idOf(x);
        if (!id || map.has(id)) return;
        map.set(id, { value: id, label: labelOf(x, id) });
    });

    return [...map.values()];
};

const buildInitial = (
    item: ProjectComponentDTO | null | undefined,
    project?: Project | string | null
): ProjectComponentDTO =>
    ({
        ...(item ?? {}),
        project: project ?? item?.project ?? undefined,
        title: item?.title ?? '',
        description: item?.description ?? '',
        contributors: item?.contributors ?? [],
        activities: item?.activities ?? [],
        themes: item?.themes ?? [],
    }) as ProjectComponentDTO;

// ---------- component ----------

const ProjectComponentForm = ({
    item,
    saving,
    formId,
    onSubmit,
    project,
}: ProjectComponentFormProps) => {

    const [localItem, setLocalItem] = useState<ProjectComponentDTO>(
        buildInitial(item, project)
    );

    // Raw loaded data
    const [users, setUsers] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [themes, setThemes] = useState<any[]>([]);

    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [loadingThemes, setLoadingThemes] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const projectId = idOf(localItem.project);

    // Project themes: populated objects or plain ID strings.
    const projectThemes: any[] = useMemo(() => {
        const p = localItem.project;
        return typeof p === 'object' && p ? ((p as Project).themes ?? []) as any[] : [];
    }, [localItem.project]);

    // Stable key so the effect only reruns when the theme list really changes.
    const themesKey = projectThemes.map(idOf).join(',');

    // Reset form when selected component or project changes.
    useEffect(() => {
        setLocalItem(buildInitial(item, project));
        setSubmitted(false);
    }, [item, project]);

    // Load project collaborators (contributor options).
    useEffect(() => {
        if (!projectId) {
            setUsers([]);
            return;
        }

        let cancelled = false;

        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const data = await CollaboratorApi.lookup!({ project: projectId });
                if (!cancelled) setUsers(data.map((c: any) => c.member));
            } catch (error) {
                console.error('Failed to load users:', error);
                if (!cancelled) setUsers([]);
            } finally {
                if (!cancelled) setLoadingUsers(false);
            }
        };

        fetchUsers();
        return () => { cancelled = true; };
    }, [projectId]);

    // Load project activities.
    useEffect(() => {
        if (!projectId) {
            setActivities([]);
            return;
        }

        let cancelled = false;

        const fetchActivities = async () => {
            setLoadingActivities(true);
            try {
                const data = await ActivityApi.lookup!({ project: projectId });
                if (!cancelled) setActivities(data as any[]);
            } catch (error) {
                console.error('Failed to load activities:', error);
                if (!cancelled) setActivities([]);
            } finally {
                if (!cancelled) setLoadingActivities(false);
            }
        };

        fetchActivities();
        return () => { cancelled = true; };
    }, [projectId]);

    // Resolve project themes (use populated objects, fetch by ID otherwise).
    useEffect(() => {
        if (!projectThemes.length) {
            setThemes([]);
            return;
        }

        let cancelled = false;

        const resolveThemes = async () => {
            setLoadingThemes(true);
            try {
                const resolved = await Promise.all(
                    projectThemes.map(async (t) => {
                        if (typeof t === 'object' && t?.title) return t as Theme;
                        try {
                            return (await ThemeApi.getById!(idOf(t))) as Theme;
                        } catch {
                            return null;
                        }
                    })
                );
                if (!cancelled) setThemes(resolved.filter(Boolean));
            } finally {
                if (!cancelled) setLoadingThemes(false);
            }
        };

        resolveThemes();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [themesKey]);

    // Selected IDs (unique, always strings)
    const contributorIds = uniqueIds(localItem.contributors as any[]);
    const activityIds = uniqueIds(localItem.activities as any[]);
    const themeIds = uniqueIds(localItem.themes as any[]);

    // Options: loaded items + current selection, deduped, always labeled
    const userOptions = useMemo(
        () => buildOptions(users, (localItem.contributors as any[]) ?? []),
        [users, localItem.contributors]
    );
    const activityOptions = useMemo(
        () => buildOptions(activities, (localItem.activities as any[]) ?? []),
        [activities, localItem.activities]
    );
    const themeOptions = useMemo(
        () => buildOptions(themes, (localItem.themes as any[]) ?? []),
        [themes, localItem.themes]
    );

    const titleMissing = !localItem.title?.trim();
    const descriptionMissing = !localItem.description?.trim();
    const projectMissing = !projectId;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving || projectMissing || titleMissing || descriptionMissing) {
            return;
        }

        const payload: ProjectComponentDTO = {
            ...localItem,
            project: projectId,
            title: localItem.title.trim(),
            description: localItem.description?.trim(),
            contributors: contributorIds,
            activities: activityIds,
            themes: themeIds,
        };

        await onSubmit(payload);
    };

    const isLocked = (item as any)?.status === 'approved';

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid"
            noValidate
        >
            <div className="grid">

                {/* Project */}
                <div className="field col-12">
                    <label className="font-bold text-sm block mb-2">
                        Project <span className="text-red-500">*</span>
                    </label>

                    <div
                        className={classNames(
                            'p-inputtext p-component flex align-items-center surface-100 text-color-secondary',
                            { 'p-invalid': submitted && projectMissing }
                        )}
                    >
                        {typeof localItem.project === 'object' && localItem.project
                            ? localItem.project.title
                            : projectId
                                ? `Project ID: ${projectId}`
                                : 'No project selected'}
                    </div>

                    {submitted && projectMissing && (
                        <small className="p-error block mt-1">
                            A project is required.
                        </small>
                    )}
                </div>

                {/* Component Title */}
                <div className="field col-12">
                    <label htmlFor="title" className="font-bold text-sm block mb-2">
                        Component Title <span className="text-red-500">*</span>
                    </label>

                    <InputText
                        id="title"
                        value={localItem.title}
                        onChange={(e) =>
                            setLocalItem((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="e.g., Component 1: Baseline Survey"
                        disabled={saving || isLocked}
                        className={classNames({ 'p-invalid': submitted && titleMissing })}
                    />

                    {submitted && titleMissing && (
                        <small className="p-error block mt-1">
                            Component title is required.
                        </small>
                    )}
                </div>

                {/* Description */}
                <div className="field col-12">
                    <label htmlFor="description" className="font-bold text-sm block mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>

                    <InputTextarea
                        id="description"
                        value={localItem.description ?? ''}
                        onChange={(e) =>
                            setLocalItem((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                        autoResize
                        placeholder="Describe the project component..."
                        disabled={saving || isLocked}
                        className={classNames({ 'p-invalid': submitted && descriptionMissing })}
                    />

                    {submitted && descriptionMissing && (
                        <small className="p-error block mt-1">
                            Description is required.
                        </small>
                    )}
                </div>

                {/* Contributors */}
                <div className="field col-12">
                    <label htmlFor="contributors" className="font-bold text-sm block mb-2">
                        Contributors
                    </label>

                    <MultiSelect
                        id="contributors"
                        value={contributorIds}
                        options={userOptions}
                        optionLabel="label"
                        optionValue="value"
                        dataKey="value"
                        onChange={(e) =>
                            setLocalItem((prev) => ({ ...prev, contributors: e.value }))
                        }
                        placeholder="Select contributors"
                        display="chip"
                        filter
                        showClear
                        disabled={saving || loadingUsers || isLocked}
                        maxSelectedLabels={3}
                    />

                    <small className="text-color-secondary block mt-1">
                        Only project collaborators can be selected.
                    </small>
                </div>

                {/* Themes */}
                <div className="field col-12">
                    <label htmlFor="themes" className="font-bold text-sm block mb-2">
                        Themes
                    </label>

                    <MultiSelect
                        id="themes"
                        value={themeIds}
                        options={themeOptions}
                        optionLabel="label"
                        optionValue="value"
                        dataKey="value"
                        onChange={(e) =>
                            setLocalItem((prev) => ({ ...prev, themes: e.value }))
                        }
                        placeholder={
                            themeOptions.length || loadingThemes
                                ? 'Select themes'
                                : 'This project has no themes'
                        }
                        display="chip"
                        filter
                        showClear
                        disabled={saving || loadingThemes || !themeOptions.length || isLocked}
                        maxSelectedLabels={3}
                    />

                    <small className="text-color-secondary block mt-1">
                        Themes come from the project.
                    </small>
                </div>

                {/* Activities */}
                <div className="field col-12">
                    <label htmlFor="activities" className="font-bold text-sm block mb-2">
                        Activities
                    </label>

                    <MultiSelect
                        id="activities"
                        value={activityIds}
                        options={activityOptions}
                        optionLabel="label"
                        optionValue="value"
                        dataKey="value"
                        onChange={(e) =>
                            setLocalItem((prev) => ({ ...prev, activities: e.value }))
                        }
                        placeholder={
                            activityOptions.length || loadingActivities
                                ? 'Select activities'
                                : 'This project has no activities'
                        }
                        display="chip"
                        filter
                        showClear
                        disabled={saving || loadingActivities || !activityOptions.length || isLocked}
                        maxSelectedLabels={3}
                    />

                    <small className="text-color-secondary block mt-1">
                        An activity can belong to only one component.
                    </small>
                </div>

            </div>
        </form>
    );
};

export default ProjectComponentForm;