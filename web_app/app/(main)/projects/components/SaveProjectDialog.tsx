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
import { CallApi } from '../../calls/api/call.api';
import { Call } from '../../calls/models/call.model';

interface SaveProjectDialogProps {
    visible: boolean;
    project: Project;
    onHide: () => void;
    onComplete?: (savedProject: Project) => void;
}

const SaveProjectDialog = ({ visible, project, onHide, onComplete }: SaveProjectDialogProps) => {

    const toast = useRef<Toast>(null);
    const [localProject, setLocalProject] = useState<Project>({ ...project });
    const [submitted, setSubmitted] = useState(false);
    const [calls, setCalls] = useState<Call[]>([]);

    // Fetch active calls if no call selected
    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const data = await CallApi.getCalls({});
                setCalls(data);
            } catch (err) {
                console.error('Failed to fetch calls:', err);
            }
        };
        fetchCalls();
    }, []);

    const save = async () => {
        try {
            setSubmitted(true);
            const validation = validateProject(localProject);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved: Project;
            if (localProject._id) {
                saved = await ProjectApi.update(localProject);
            } else {
                saved = await ProjectApi.create(localProject);
            }
            saved = {
                ...saved,
                call: localProject.call
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Project saved successfully',
                life: 2000,
            });
           if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save project',
                life: 2000,
            });
        }
    };

    const hide = () => {
        setSubmitted(false);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    // Reset localProject when dialog opens
    useEffect(() => {
        if (visible) {
            setLocalProject({ ...project });
            setSubmitted(false);
        }
    }, [visible, project]);

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localProject._id ? 'Edit Project' : 'New Project'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                <div className="p-fluid formgrid grid">
                    {!localProject._id && (
                        <div className="field col-12">
                            <label htmlFor="call">Call</label>
                            <Dropdown
                                id="call"
                                dataKey="_id"
                                options={calls}
                                value={localProject.call}
                                onChange={(e) => setLocalProject({ ...localProject, call: e.value })}
                                required
                                optionLabel="title"
                                placeholder="Select a Call"
                                className={classNames({ 'p-invalid': submitted && !localProject.call })}
                            />
                        </div>
                    )}

                    <div className="field col-12">
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

                    <div className="field col-12">
                        <label htmlFor="description">Description</label>
                        <InputTextarea
                            id="description"
                            value={localProject.summary ?? ''}
                            onChange={(e) => setLocalProject({ ...localProject, summary: e.target.value })}
                            rows={5}
                            autoResize
                            placeholder="Enter Project summary ..."
                            className="w-full"
                        />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveProjectDialog;
