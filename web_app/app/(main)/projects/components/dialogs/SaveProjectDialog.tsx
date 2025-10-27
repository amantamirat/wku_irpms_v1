'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { CallApi } from '@/app/(main)/calls/api/call.api';
import { Call, CallStatus } from '@/app/(main)/calls/models/call.model';
import { Project, validateProject } from '../../models/project.model';
import { ProjectApi } from '../../api/project.api';

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
    //const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [calls, setCalls] = useState<Call[] | undefined>(undefined);

    // Fetch active calls if no call selected
    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const data = await CallApi.getCalls({ status: CallStatus.active });
                setCalls(data);
            } catch (err) {
                console.error('Failed to fetch calls:', err);
            }
        };
        if (!localProject.call) fetchCalls();
    }, [localProject.call]);

    const save = async () => {
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
            call: localProject.call
        };

        toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Project saved successfully',
            life: 2000,
        });

        if (onComplete) onComplete(saved);
    };

    const hide = () => {
        setSubmitted(false);
        //setErrorMessage(undefined);
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
            //setErrorMessage(undefined);
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

                    {
                        //errorMessage && <small className="p-error">{errorMessage}</small>
                    }
                </div>
            </Dialog>
        </>
    );
};

export default SaveProjectDialog;
