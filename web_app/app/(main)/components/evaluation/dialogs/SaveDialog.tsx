'use client';

import { EvalType, Evaluation, FormType, validateEvaluation } from '@/models/theme/evaluation';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';

interface SaveDialogProps {
    visible: boolean;
    evaluation: Evaluation;
    onChange: (e: Evaluation) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, evaluation, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const isStage = evaluation.type === EvalType.stage;
    const isCreterion = evaluation.type === EvalType.criterion;

    const save = async () => {
        setSubmitted(true);
        const result = validateEvaluation(evaluation);
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
            header={evaluation._id ? `Edit ${evaluation.type}` : `New ${evaluation.type}`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            {evaluation && (
                <>
                    <div className="field">
                        <label htmlFor="title">Title</label>
                        <InputText
                            id="title"
                            value={evaluation.title}
                            onChange={(e) => onChange({ ...evaluation, title: e.target.value })}
                            required
                            autoFocus
                            className={classNames({ 'p-invalid': submitted && !evaluation.title })}
                        />
                    </div>

                    {isStage && evaluation._id &&
                        (<div className="field">
                            <label htmlFor="Level">Stage Level</label>
                            <InputNumber
                                id="stage_level"
                                value={evaluation.stage_level}
                                onChange={(e) =>
                                    onChange({ ...evaluation, stage_level: e.value || 0 })
                                }
                                required
                                className={classNames({
                                    'p-invalid': submitted && isStage && (evaluation.stage_level == null || evaluation.stage_level <= 0),
                                })}
                            />
                            {submitted && isStage && !(evaluation.stage_level == null || evaluation.stage_level <= 0) && (
                                <small className="p-invalid">Stage Level is required.</small>
                            )}
                        </div>)}
                    {isCreterion && (<>

                        <div className="field">
                            <label htmlFor="weight_value">Weight</label>
                            <InputNumber
                                id="weight_value"
                                value={evaluation.weight_value}
                                onChange={(e) =>
                                    onChange({ ...evaluation, weight_value: e.value || 0 })
                                }
                                required
                                className={classNames({
                                    'p-invalid': submitted && (isCreterion) && (evaluation.weight_value == null || evaluation.weight_value <= 0),
                                })}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="form_type">Form Type</label>
                            <Dropdown
                                id="type"
                                value={evaluation.form_type}
                                options={Object.values(FormType).map(g => ({ label: g, value: g }))}
                                onChange={(e) =>
                                    onChange({ ...evaluation, form_type: e.value })
                                }
                                placeholder="Select Form"
                                className={classNames({ 'p-invalid': submitted && isCreterion && !evaluation.form_type })}
                            />
                        </div>
                    </>)
                    }

                </>)}

            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
