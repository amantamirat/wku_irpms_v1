'use client';
import { EvaluationApi } from '@/app/(main)/evaluations/api/evaluation.api';
import { Evaluation } from '@/app/(main)/evaluations/models/evaluation.model';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Call, CallStatus } from '../../models/call.model';
import { StageApi } from '../api/stage.api';
import { Stage, validateStage } from '../models/stage.model';
import { CallApi } from '../../api/call.api';

interface SaveStageProps {
    visible: boolean;
    stage: Stage;
    callProvided: boolean;
    onComplete?: (savedStage: Stage) => void;
    onHide: () => void;
}

const SaveStage = ({ visible, stage, callProvided, onComplete, onHide }: SaveStageProps) => {

    const toast = useRef<Toast>(null);
    const [localStage, setLocalStage] = useState<Stage>({ ...stage });
    const [submitted, setSubmitted] = useState(false);

    const [calls, setCalls] = useState<Call[] | undefined>(undefined);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

    // Load active calendars
    useEffect(() => {
        if (callProvided) {
            return
        }
        const loadCalls = async () => {
            try {
                const data = await CallApi.getCalls({ status: CallStatus.active });
                setCalls(data);
            } catch (err) {
                console.error('Failed to load calls:', err);
            }
        };
        loadCalls();
    }, [callProvided]);

    useEffect(() => {
        const fetchEvaluations = async () => {
            try {
                const data = await EvaluationApi.getEvaluations({ directorate: (localStage.call as Call).directorate });
                setEvaluations(data);
            } catch (err) {
                console.error('Failed to fetch evaluations:', err);
            }
        };
        fetchEvaluations();
    }, [localStage.call]);


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
        try {
            setSubmitted(true);
            const validation = validateStage(localStage);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Stage;

            if (localStage._id) saved = await StageApi.update(localStage);
            else saved = await StageApi.create(localStage);

            saved = {
                ...saved,
                call: localStage.call,
                evaluation: localStage.evaluation
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Stage saved successfully',
                life: 2000,
            });

            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Stage',
                life: 2000,
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

                {
                    (!callProvided && !localStage._id) &&
                    <div className="field">
                        <label htmlFor="call">Call</label>
                        <Dropdown
                            id="call"
                            value={localStage.call}
                            options={calls}
                            optionLabel="title"
                            onChange={(e) => setLocalStage({ ...localStage, call: e.value })}
                            placeholder="Select Call"
                            className={classNames({ 'p-invalid': submitted && !localStage.call })}
                        />
                    </div>
                }

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

                {/* Evaluation Selector */}
                {!localStage._id
                    &&
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
                }
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

            </Dialog>
        </>
    );
};

export default SaveStage;
