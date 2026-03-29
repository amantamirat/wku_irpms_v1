'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { TreeSelect } from 'primereact/treeselect';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { Project, validateProject } from '../models/project.model';
import { ProjectApi } from '../api/project.api';
import { GrantApi } from '../../grants/api/grant.api';
import { GrantStatus } from '../../grants/models/grant.state-machine';
import { Grant } from '../../grants/models/grant.model';
import { ApplicantApi } from '../../applicants/api/applicant.api';
import { Applicant } from '../../applicants/models/applicant.model';
import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import { Theme } from '@/app/(main)/thematics/themes/models/theme.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

// --- Tree Helper (Same logic as your Theme dialog) ---
type Node = {
    key?: string;
    label: string;
    data?: string;
    children?: Node[];
    selectable?: boolean;
};

const buildTree = (themes: Theme[], parentId?: string): Node[] => {
    return themes
        .filter(t => {
            const pid = typeof t.parent === "object" ? t.parent?._id : t.parent;
            return parentId ? pid === parentId : !pid;
        })
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
        .map(t => {
            const children = buildTree(themes, t._id);
            const node: Node = {
                key: t._id, // If Theme interface has _id as optional, use t._id!
                label: t.title,
                data: t._id,
                selectable: children.length === 0,
            };

            if (children.length > 0) {
                node.children = children;
            }

            return node;
        });
};

const SaveProject = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Project>) => {
    const toast = useRef<Toast>(null);

    // Initialize themes as an empty array if undefined
    const [localProject, setLocalProject] = useState<Project>({
        ...item,
        themes: item.themes || []
    });

    const [submitted, setSubmitted] = useState(false);
    const [grants, setGrants] = useState<Grant[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [themeNodes, setThemeNodes] = useState<Node[]>([]);

    const isGrantPredefined = !!item.grant;
    const isApplicantPredefined = !!item.applicant;
    const isEditMode = !!item._id;

    useEffect(() => {
        setLocalProject({ ...item, themes: item.themes || [] });
    }, [item]);

    // 1. Initial Load: Fetch Grants and Applicants only
    useEffect(() => {
        const loadStaticData = async () => {
            try {
                if (visible) {
                    const [gData, aData] = await Promise.all([
                        (!isGrantPredefined && !isEditMode) ? GrantApi.getAll({ status: GrantStatus.active }) : Promise.resolve([]),
                        (!isApplicantPredefined && !isEditMode) ? ApplicantApi.getAll({}) : Promise.resolve([])
                    ]);

                    if (gData.length) setGrants(gData);
                    if (aData.length) setApplicants(aData);
                }
            } catch (err) {
                console.error('Static data load error:', err);
            }
        };
        loadStaticData();
    }, [visible]); // Only runs on mount/visibility

    // 2. Reactive Load: Fetch Themes whenever the Grant changes
    useEffect(() => {
        const fetchThemesForGrant = async () => {
            // Identify the thematic ID from the grant
            // It handles both populated object and raw ID string cases
            const grantObj = localProject.grant as Grant;
            const thematicId = typeof grantObj === 'object' ? grantObj?.thematic : null;

            if (visible && thematicId) {
                try {
                    const tData = await ThemeApi.getAll({ thematicArea: thematicId });
                    setThemeNodes(buildTree(tData));
                } catch (err) {
                    console.error('Failed to fetch themes for grant:', err);
                    setThemeNodes([]); // Clear nodes on error
                }
            } else {
                setThemeNodes([]); // Clear if no grant/thematic selected
            }
        };

        fetchThemesForGrant();
    }, [localProject.grant, visible]); // Dependency on the selected grant

    /**
     * Converts flat array ["id1", "id2"] to PrimeReact's TreeSelect Selection format:
     * { "id1": { checked: true }, "id2": { checked: true } }
     */
    const getThemeSelectionKeys = () => {
        const selection: any = {};
        localProject.themes?.forEach((t: any) => {
            const id = typeof t === 'object' ? t._id : t;
            selection[id] = { checked: true, partialChecked: false };
        });
        return selection;
    };

    /**
     * Converts TreeSelect Selection object back to flat array of IDs
     */
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
                    {/* Grant Field */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Grant</label>
                        {isGrantPredefined ? (
                            <InputText value={(localProject.grant as any)?.title || 'Selected Grant'} disabled className="surface-100" />
                        ) : (
                            <Dropdown
                                value={localProject.grant}
                                options={grants}
                                dataKey="_id"
                                optionLabel="title"
                                onChange={(e) =>
                                    setLocalProject({
                                        ...localProject, grant: e.value,
                                        themes: []
                                    })}
                                placeholder="Select a Grant"
                                className={classNames({ 'p-invalid': submitted && !localProject.grant })}
                            />
                        )}
                    </div>

                    {/* Applicant Field */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Applicant</label>
                        {isApplicantPredefined ? (
                            <InputText value={(localProject.applicant as any)?.name || 'Selected Applicant'} disabled className="surface-100" />
                        ) : (
                            <Dropdown
                                value={localProject.applicant}
                                options={applicants}
                                dataKey="_id"
                                optionLabel="name"
                                onChange={(e) => setLocalProject({ ...localProject, applicant: e.value })}
                                placeholder="Select an Applicant"
                                className={classNames({ 'p-invalid': submitted && !localProject.applicant })}
                            />
                        )}
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

                {/* The "Options" style Section for Themes */}
                <div className="field border-top-1 surface-border pt-3">
                    <label className="font-bold mb-2 block">Thematic Focus</label>
                    <TreeSelect
                        value={getThemeSelectionKeys()}
                        options={themeNodes}
                        onChange={onThemeChange}
                        display="chip"
                        selectionMode="checkbox"
                        placeholder="Select one or more themes"
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