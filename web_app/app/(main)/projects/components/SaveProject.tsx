'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { TreeSelect } from 'primereact/treeselect';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
// Updated to target your Grant API, template, and status configs directly
import { GrantApi } from '../../grants/api/grant.api';
import { Grant } from '../../grants/models/grant.model';
import { buildTree, ThemeNode } from '../../thematics/models/thematic.node';
import { ProjectApi } from '../api/project.api';
import { Project, validateProject } from '../models/project.model';
import { GrantStatus } from '../../grants/models/grant.state-machine';

interface ExtendedProject extends Project {
    _filterCalendar?: string;
    _filterGrant?: string;
}

const SaveProject = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<ExtendedProject>) => {
    const toast = useRef<Toast>(null);

    const [localProject, setLocalProject] = useState<Project>({
        ...item,
        themes: item.themes || []
    });

    const [submitted, setSubmitted] = useState(false);
    const [grants, setGrants] = useState<Grant[]>([]); // 🟢 Changed from allocations to grants
    const [themeNodes, setThemeNodes] = useState<ThemeNode[]>([]);
    const isGrantPredefined = !!item.grant; // 🟢 Changed from isAllocationPredefined
    const isEditMode = !!item._id;

    useEffect(() => {
        setLocalProject({ ...item, themes: item.themes || [] });
    }, [item]);

    // 1. Initial Load: Fetch Active Grants
    useEffect(() => {
        const loadInitialData = async () => {
            if (!visible) return;
            try {
                const [gData] = await Promise.all([
                    (!isGrantPredefined && !isEditMode)
                        ? GrantApi.getAll({ status: GrantStatus.active, populate: true }) // 🟢 Changed to fetch Grants
                        : Promise.resolve([])
                ]);

                if (gData.length) setGrants(gData);
            } catch (err) {
                console.error('Initial data load error:', err);
            }
        };
        loadInitialData();
    }, [visible, isGrantPredefined, isEditMode]);

    // 2. Reactive Load: Fetch Themes whenever the selected Grant changes
    useEffect(() => {
        const fetchThemesForGrant = async () => {
            const selectedGrant = localProject.grant;

            // Extract the thematic context directly from your updated Grant object structure
            const thematicId = (typeof selectedGrant === 'object' && selectedGrant !== null)
                ? (selectedGrant as any).thematic
                : null;

            if (visible && thematicId) {
                try {
                    const tData = await ThemeApi.getAll({ thematicArea: thematicId });
                    setThemeNodes(buildTree(tData));
                } catch (err) {
                    console.error('Failed to fetch themes:', err);
                    setThemeNodes([]);
                }
            } else {
                setThemeNodes([]);
            }
        };

        fetchThemesForGrant();
    }, [localProject.grant, visible]);

    const getThemeSelectionKeys = () => {
        const selection: any = {};
        localProject.themes?.forEach((t: any) => {
            const id = typeof t === 'object' ? t._id : t;
            selection[id] = { checked: true, partialChecked: false };
        });
        return selection;
    };

    const onThemeChange = (e: any) => {
        const selectedIds = Object.keys(e.value).filter(key => e.value[key].checked);
        setLocalProject({ ...localProject, themes: selectedIds as any });
    };

    const saveProject = async () => {
        setSubmitted(true);
        try {
            const validation = validateProject(localProject);
            if (!validation.valid) throw new Error(validation.message);

            const saved = localProject._id
                ? await ProjectApi.update(localProject)
                : await ProjectApi.create(localProject);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Project saved' });
            if (onComplete) onComplete({
                ...saved,
                applicant: localProject.applicant,
                grant: localProject.grant
            });
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save Project" icon="pi pi-check" onClick={saveProject} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '750px' }}
                header={isEditMode ? 'Edit Project' : 'New Project'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
                maximizable
            >
                <div className="formgrid grid">
                    {/* Grant / Funding Source Field */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Grant Source</label>
                        {isGrantPredefined ? (
                            <InputText value={(localProject.grant as Grant).title} disabled className="surface-100" />
                        ) : (
                            <Dropdown
                                value={localProject.grant}
                                options={grants}
                                dataKey="_id"
                                optionLabel="title" // 🟢 Shows the Grant title directly
                                onChange={(e) =>
                                    setLocalProject({
                                        ...localProject,
                                        grant: e.value,
                                        themes: [] // Reset themes when selected grant changes
                                    })}
                                placeholder="Select Grant"
                                className={classNames({ 'p-invalid': submitted && !localProject.grant })}
                            />
                        )}
                    </div>

                    {/* Applicant Field */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Applicant</label>
                        <InputText value={(localProject.applicant as any)?.name || 'Selected Applicant'} disabled className="surface-100" />
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="title" className="font-bold">Project Title</label>
                    <InputText
                        id="title"
                        value={localProject.title || ''}
                        onChange={(e) => setLocalProject({ ...localProject, title: e.target.value })}
                        className={classNames({ 'p-invalid': submitted && !localProject.title })}
                    />
                </div>

                <div className="field border-top-1 surface-border pt-3">
                    <label className="font-bold mb-2 block">Thematic Focus</label>
                    <TreeSelect
                        value={getThemeSelectionKeys()}
                        options={themeNodes}
                        onChange={onThemeChange}
                        display="chip"
                        selectionMode="checkbox"
                        placeholder={localProject.grant ? "Select one or more themes" : "Please select a grant first"}
                        disabled={!localProject.grant}
                        className={classNames('w-full', { 'p-invalid': submitted && (!localProject.themes || localProject.themes.length === 0) })}
                        filter
                        scrollHeight="300px"
                    />
                    {submitted && (!localProject.themes || localProject.themes.length === 0) && (
                        <small className="p-error">At least one theme must be selected.</small>
                    )}
                </div>

                <div className="field">
                    <label htmlFor="summary" className="font-bold">Description / Summary</label>
                    <InputTextarea
                        id="summary"
                        value={localProject.summary ?? ''}
                        onChange={(e) => setLocalProject({ ...localProject, summary: e.target.value })}
                        rows={4}
                        autoResize
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveProject;