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
import { ApplicantApi } from '../../applicants/api/applicant.api';
import { Applicant } from '../../applicants/models/applicant.model';
import { ThemeApi } from '@/app/(main)/thematics/themes/api/theme.api';
import { Theme } from '@/app/(main)/thematics/themes/models/theme.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { GrantAllocation } from '../../grants/allocations/models/grant.allocation.model';
import { GrantAllocationApi } from '../../grants/allocations/api/grant.allocation.api';
import { AllocationStatus } from '../../grants/allocations/models/grant.allocation.state-machine';
import { allocationOptionTemplate, getAllocationLabel } from '../../grants/allocations/components/AllocationTempletes';

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
                key: t._id,
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
    const [allocations, setAllocations] = useState<GrantAllocation[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [themeNodes, setThemeNodes] = useState<Node[]>([]);

    const isAllocationPredefined = !!item.grantAllocation;
    const isApplicantPredefined = !!item.applicant;
    const isEditMode = !!item._id;

    useEffect(() => {
        setLocalProject({ ...item, themes: item.themes || [] });
    }, [item]);

    // 1. Initial Load: Fetch Allocations and Applicants
    useEffect(() => {
        const loadInitialData = async () => {
            if (!visible) return;
            try {
                const [aData, appData] = await Promise.all([
                    (!isAllocationPredefined && !isEditMode)
                        ? GrantAllocationApi.getAll({ status: AllocationStatus.active, populate: true })
                        : Promise.resolve([]),
                    (!isApplicantPredefined && !isEditMode)
                        ? ApplicantApi.getAll({})
                        : Promise.resolve([])
                ]);

                if (aData.length) setAllocations(aData);
                if (appData.length) setApplicants(appData);
            } catch (err) {
                console.error('Initial data load error:', err);
            }
        };
        loadInitialData();
    }, [visible]);

    // 2. Reactive Load: Fetch Themes whenever the Allocation changes
    useEffect(() => {
        const fetchThemesForAllocation = async () => {
            // Drill down into the allocation to find the thematic area ID
            const allocation = localProject.grantAllocation as GrantAllocation;
            const thematicId = (typeof allocation?.grant === 'object') ? allocation.grant?.thematic : null;

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

        fetchThemesForAllocation();
    }, [localProject.grantAllocation, visible]);

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
                grantAllocation: localProject.grantAllocation
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
                    {/* Allocation Field */}
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Funding Allocation</label>
                        {isAllocationPredefined ? (
                            <InputText value={getAllocationLabel(localProject.grantAllocation)} disabled className="surface-100" />
                        ) : (
                            <Dropdown
                                value={localProject.grantAllocation}
                                options={allocations}
                                dataKey="_id"
                                optionLabel="_id"
                                onChange={(e) =>
                                    setLocalProject({
                                        ...localProject,
                                        grantAllocation: e.value,
                                        themes: [] // Reset themes when allocation changes
                                    })}
                                valueTemplate={(option, props) => option ? allocationOptionTemplate(option) : props.placeholder}
                                itemTemplate={allocationOptionTemplate}
                                placeholder="Select Allocation"
                                className={classNames({ 'p-invalid': submitted && !localProject.grantAllocation })}
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

                <div className="field border-top-1 surface-border pt-3">
                    <label className="font-bold mb-2 block">Thematic Focus</label>
                    <TreeSelect
                        value={getThemeSelectionKeys()}
                        options={themeNodes}
                        onChange={onThemeChange}
                        display="chip"
                        selectionMode="checkbox"
                        placeholder={localProject.grantAllocation ? "Select one or more themes" : "Please select an allocation first"}
                        disabled={!localProject.grantAllocation}
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