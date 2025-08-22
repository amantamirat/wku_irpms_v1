'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';
import { Evaluation } from '../../evals/models/eval.model';
import { Theme } from '../../themes/models/theme.model';
import { Grant, validateGrant } from '../models/grant.model';

interface SaveDialogProps {
    visible: boolean;
    grant: Grant;
    themes?: Theme[];
    evaluations?: Evaluation[];
    onChange: (grant: Grant) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, grant, themes, evaluations, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const save = async () => {
        setSubmitted(true);
        const result = validateGrant(grant);
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
            style={{ width: '600px', minHeight: '600px' }}
            header={grant._id ? 'Edit Grant' : 'Create New Grant'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
            maximizable
        >
            
            <div className="field">
                <label htmlFor="title">Title</label>
                <InputText
                    id="title"
                    value={grant.title}
                    onChange={(e) => onChange({ ...grant, title: e.target.value })}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !grant.title })}
                />
            </div>

            <div className="field">
                <label htmlFor="description">Description </label>
                <InputTextarea
                    value={grant.description ?? ""}
                    onChange={(e) => onChange({ ...grant, description: e.target.value })}
                    rows={5}
                    cols={30} />
            </div>

             <div className="field">
                <label htmlFor="theme">Theme</label>
                <Dropdown
                    id="theme"
                    value={grant.theme}
                    options={themes}
                    onChange={(e) =>
                        onChange({
                            ...grant,
                            theme: e.value,
                        })
                    }
                    optionLabel="title"
                    placeholder="Select Theme"
                    required
                    className={classNames({ 'p-invalid': submitted && !grant.theme })}
                />
            </div>

            <div className="field">
                <label htmlFor="evaluation">Evaluation</label>
                <Dropdown
                    id="evaluation"
                    value={grant.evaluation}
                    options={evaluations}
                    onChange={(e) =>
                        onChange({
                            ...grant,
                            evaluation: e.value,
                        })
                    }
                    optionLabel="title"
                    placeholder="Select Evaluation"
                    required
                    className={classNames({ 'p-invalid': submitted && !grant.evaluation })}
                />
            </div>          

            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
