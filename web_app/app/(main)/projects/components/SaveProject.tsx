'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { Project, validateProject } from '../models/project.model';
import { ProjectApi } from '../api/project.api';
import { GrantApi } from '../../grants/api/grant.api';
import { GrantStatus } from '../../grants/models/grant.state-machine';
import { Grant } from '../../grants/models/grant.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveProject = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<Project>) => {
    const toast = useRef<Toast>(null);
    const [localProject, setLocalProject] = useState<Project>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [grants, setGrants] = useState<Grant[]>([]);

    // Sync local state with prop item
    useEffect(() => {
        setLocalProject({ ...item });
    }, [item]);

    // Fetch active grants for the dropdown
    useEffect(() => {
        const fetchGrants = async () => {
            try {
                const data = await GrantApi.getAll({ status: GrantStatus.active });
                setGrants(data);
            } catch (err) {
                console.error('Failed to fetch grants:', err);
            }
        };
        if (visible) fetchGrants();
    }, [visible]);

    // Reset form when dialog closes
    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalProject({ ...item });
    };

    const saveProject = async () => {
        setSubmitted(true);
        try {
            const validation = validateProject(localProject);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved = localProject._id
                ? await ProjectApi.update(localProject)
                : await ProjectApi.create(localProject);

            // Re-attach grant reference for the UI if necessary
            saved = {
                ...saved,
                grant: localProject.grant
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Project saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save project',
                life: 2500,
            });
        }
    };

    const hide = () => {
        clearForm();
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveProject} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localProject._id ? 'Edit Project' : 'New Project'}
                modal
                maximizable
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Grant Selection - usually only for new projects */}
                {!localProject._id && (
                    <div className="field">
                        <label htmlFor="grant">Grant</label>
                        <Dropdown
                            id="grant"
                            dataKey="_id"
                            options={grants}
                            value={localProject.grant}
                            onChange={(e) => setLocalProject({ ...localProject, grant: e.value })}
                            required
                            optionLabel="title"
                            placeholder="Select a Grant"
                            className={classNames({ 'p-invalid': submitted && !localProject.grant })}
                        />
                    </div>
                )}

                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localProject.title}
                        onChange={(e) => setLocalProject({ ...localProject, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localProject.title })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="summary">Description</label>
                    <InputTextarea
                        id="summary"
                        value={localProject.summary ?? ''}
                        onChange={(e) => setLocalProject({ ...localProject, summary: e.target.value })}
                        rows={5}
                        autoResize
                        placeholder="Enter Project summary ..."
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveProject;