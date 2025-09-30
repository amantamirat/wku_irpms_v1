'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { Project, validateProject } from '../../models/project.model';
import ProjectForm from './ProjectForm';
import { Call, CallStatus } from '@/app/(main)/calls/models/call.model';
import { Dropdown } from 'primereact/dropdown';
import { CallApi } from '@/app/(main)/calls/api/call.api';


interface SaveDialogProps {
    visible: boolean;
    project: Project;
    setProject: (e: Project) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveProjectDialog(props: SaveDialogProps) {
    const { visible, project, setProject, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [calls, setCalls] = useState<Call[]>([]);

    useEffect(() => {
        const fetchCalls = async () => {
            const data = await CallApi.getCalls({ status: CallStatus.active });
            setCalls(data);
        };
        fetchCalls();
    }, []);

    const save = async () => {
        setSubmitted(true);
        const result = validateProject(project);
        if (!result.valid) {
            setErrorMessage(result.message);
            return;
        }
        setErrorMessage(undefined);
        onSave();
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);

    return (
        <Dialog
            visible={visible}
            style={{ width: '500px' }}
            header={project._id ? 'Edit Project' : "New Project"}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            <div className="p-fluid formgrid grid">
                <div className="field col-12">
                    <label htmlFor="call">Call</label>
                    <Dropdown
                        id="call"
                        options={calls}
                        value={project.call}
                        onChange={(e) => setProject({ ...project, call: e.value })}
                        required
                        optionLabel="title"
                        placeholder="Select a Call"
                        className="w-full"
                    />
                </div>
            </div>
            <ProjectForm project={project} setProject={setProject} />
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}

        </Dialog>
    );
}

export default SaveProjectDialog;
