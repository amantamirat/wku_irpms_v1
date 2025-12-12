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
    const [cycles, setCycles] = useState<Call[]>([]);

    // Fetch active calls if no call selected
    useEffect(() => {
        const fetchCycles = async () => {
            try {
                const data = await CallApi.getCalls({});
                setCycles(data);
            } catch (err) {
                console.error('Failed to fetch calls:', err);
            }
        };
        fetchCycles();
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
                saved = await ProjectApi.updateProject(localProject);
            } else {
                saved = await ProjectApi.createProject(localProject);
            }
            saved = {
                ...saved,
                cycle: localProject.cycle
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Project saved successfully',
                life: 2000,
            });

            if (onComplete) onComplete(saved);
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
                            <label htmlFor="cycle">Cycle</label>
                            <Dropdown
                                id="cycle"
                                dataKey="_id"
                                options={cycles}
                                value={localProject.cycle}
                                onChange={(e) => setLocalProject({ ...localProject, cycle: e.value })}
                                required
                                optionLabel="title"
                                placeholder="Select a Cycle"
                                className={classNames({ 'p-invalid': submitted && !localProject.cycle })}
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
