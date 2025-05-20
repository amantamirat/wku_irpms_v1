'use client';

import { Stage, validateStage } from '@/models/evaluation/stage';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';

interface SaveDialogProps {
    visible: boolean;
    stage: Stage;
    onChange: (stage: Stage) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, stage, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const save = async () => {
        setSubmitted(true);
        const result = validateStage(stage);
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
            header={stage._id ? 'Edit Stage' : 'New Stage'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            <div className="field">
                <label htmlFor="title">Title</label>
                <InputText
                    id="title"
                    value={stage.title}
                    onChange={(e) => onChange({ ...stage, title: e.target.value })}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !stage.title })}
                />
            </div>

            {!stage._id &&
                <div className="field">
                    <label htmlFor="level">Level</label>
                    <InputNumber
                        id="level"
                        value={stage.level}
                        onChange={(e) =>
                            onChange({ ...stage, level: e.value || 0 })
                        }
                        required
                        className={classNames({
                            'p-invalid': submitted && (stage.level == null || stage.level <= 0),
                        })}
                    />
                </div>
            }

            <div className="field">
                <label htmlFor="total_weight">Total Weight</label>
                <InputNumber
                    id="total_weight"
                    value={stage.total_weight}
                    onChange={(e) =>
                        onChange({
                            ...stage, total_weight: e.value || 0,
                        })
                    }
                />
            </div>
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
