'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { Project, validateProject } from '../../models/project.model';
import ProjectInfoStep from '../ProjectInfoStep';
import { Call } from '@/app/(main)/calls/models/call.model';
import { Dropdown } from 'primereact/dropdown';


interface SaveDialogProps {
    visible: boolean;
    project: Project;
    onChange: (e: Project) => void;
    calls: Call[];
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, project, onChange, onSave, onHide, calls } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

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
                        onChange={(e) => onChange({ ...project, call: e.value })}
                        required
                        optionLabel="title"
                        placeholder="Select a Call"
                        className="w-full"
                    />
                </div>
            </div>
            <ProjectInfoStep project={project} setProject={onChange} calls={calls} />
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}

        </Dialog>
    );
}

export default SaveDialog;
