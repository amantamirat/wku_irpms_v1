'use client';

import { Theme, validateTheme } from '@/models/theme/theme';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';

interface SaveDialogProps {
    visible: boolean;
    theme: Theme;
    onChange: (theme: Theme) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, theme, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const save = async () => {
        setSubmitted(true);
        const result = validateTheme(theme);
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
            header={theme._id ? 'Edit Theme' : 'New Theme'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            <div className="field">
                <label htmlFor="title">Title</label>
                <InputText
                    id="title"
                    value={theme.title}
                    onChange={(e) => onChange({ ...theme, title: e.target.value })}
                    required
                    autoFocus
                    className={classNames({ 'p-invalid': submitted && !theme.title })}
                />
            </div>
            {errorMessage && (
                <small className="p-error">{errorMessage}</small>
            )}
        </Dialog>
    );
}

export default SaveDialog;
