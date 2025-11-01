'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { StageApi } from '../api/stage.api';
import { Stage, StageStatus, StageType, validateStage } from '../models/stage.model';
import { Evaluation } from '../../evaluations/models/evaluation.model';
import { EvaluationApi } from '../../evaluations/api/evaluation.api';
import { Call } from '../models/call.model';

interface SaveStageProps {
    visible: boolean;
    stage: Stage;
    call?: Call;
    onComplete?: (savedStage: Stage) => void;
    onHide: () => void;
}

const SaveStage = ({ visible, stage, call, onComplete, onHide }: SaveStageProps) => {
    const toast = useRef<Toast>(null);
    const [localStage, setLocalStage] = useState<Stage>({ ...stage });
    const [submitted, setSubmitted] = useState(false);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    useEffect(() => {
        const fetchEvaluations = async () => {
            try {
                if (call?.directorate) {
                    let directorateId: string;

                    if (typeof call.directorate === 'string') {
                        directorateId = call.directorate;
                    } else if (typeof call.directorate === 'object' && call.directorate !== null) {
                        directorateId = (call.directorate as { _id: string })._id;
                    } else {
                        return; // invalid directorate, do nothing
                    }
                    const data = await EvaluationApi.getEvaluations({ directorate: directorateId });
                    setEvaluations(data);
                }
            } catch (err) {
                console.error('Failed to fetch evaluations:', err);
            }
        };
        fetchEvaluations();
    }, [call]);


    useEffect(() => {
        setLocalStage({ ...stage });
    }, [stage]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalStage({ ...stage });
    };

    const saveStage = async () => {
        setSubmitted(true);
        try {
            const validation = validateStage(localStage);
            if (!validation.valid) throw new Error(validation.message);

            let saved = localStage._id
                ? await StageApi.updateStage(localStage)
                : await StageApi.createStage(localStage);

            saved = {
                ...saved,
                evaluation: localStage.evaluation
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Stage saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Stage',
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
            <Button label="Save" icon="pi pi-check" text onClick={saveStage} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localStage._id ? 'Edit Stage' : 'New Stage'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Stage Name */}
                <div className="field">
                    <label htmlFor="name">Stage Name</label>
                    <InputText
                        id="name"
                        value={localStage.name}
                        onChange={(e) => setLocalStage({ ...localStage, name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localStage.name })}
                    />
                </div>

                {/* Stage Type */}
                <div className="field">
                    <label htmlFor="type">Stage Type</label>
                    <Dropdown
                        id="type"
                        value={localStage.type}
                        options={Object.values(StageType)}
                        onChange={(e) => setLocalStage({ ...localStage, type: e.value })}
                        placeholder="Select Stage Type"
                        className={classNames({ 'p-invalid': submitted && !localStage.type })}
                    />
                </div>

                {/* Evaluation Selector */}
                <div className="field">
                    <label htmlFor="evaluation">Evaluation</label>
                    <Dropdown
                        id="evaluation"
                        dataKey="_id"
                        value={localStage.evaluation}
                        options={evaluations}
                        optionLabel="title"
                        onChange={(e) => setLocalStage({ ...localStage, evaluation: e.value })}
                        placeholder="Select Evaluation"
                        className={classNames({ 'p-invalid': submitted && !localStage.evaluation })}
                    />
                </div>

                {/* Deadline */}
                <div className="field">
                    <label htmlFor="deadline">Deadline</label>
                    <Calendar
                        id="deadline"
                        value={localStage.deadline ? new Date(localStage.deadline) : undefined}
                        onChange={(e) => setLocalStage({ ...localStage, deadline: e.value as Date })}
                        showIcon
                        dateFormat="yy-mm-dd"
                        placeholder="Select Deadline"
                    />
                </div>

                {/* Status */}
                <div className="field">
                    <label htmlFor="status">Status</label>
                    <Dropdown
                        id="status"
                        value={localStage.status}
                        options={Object.values(StageStatus)}
                        onChange={(e) => setLocalStage({ ...localStage, status: e.value })}
                        placeholder="Select Status"
                        className={classNames({ 'p-invalid': submitted && !localStage.status })}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveStage;
