'use client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { ThemeApi } from '../api/theme.api';
import { Theme, validateTheme } from '../models/theme.model';


interface SaveDialogProps {
    visible: boolean;
    theme: Theme;
    onComplete?: (savedTheme: Theme) => void;
    onHide: () => void;
}

const SaveDialog = ({ visible, theme, onComplete, onHide }: SaveDialogProps) => {
    const { getOrganizationsByType } = useAuth();
    const toast = useRef<Toast>(null);
    const [localTheme, setLocalTheme] = useState<Theme>({ ...theme });
    const [submitted, setSubmitted] = useState(false);


    useEffect(() => {
        setLocalTheme({ ...theme });
    }, [theme]);


    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalTheme({ ...theme });
    };

    const saveTheme = async () => {
        setSubmitted(true);
        try {
            const result = validateTheme(localTheme);
            if (!result.valid) {
                throw new Error(result.message);
            }

            let saved = localTheme._id
                ? await ThemeApi.updateTheme(localTheme)
                : await ThemeApi.createTheme(localTheme);

            saved = {
                ...saved,
                thematicArea: localTheme.thematicArea,
                parent: localTheme.parent
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Theme saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Theme',
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
            <Button label="Save" icon="pi pi-check" text onClick={saveTheme} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localTheme._id ? `Edit Theme` : `New Theme`}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >


                {/* Title Field */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localTheme.title}
                        onChange={(e) => setLocalTheme({ ...localTheme, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localTheme.title })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="priority">
                        Priority
                    </label>
                    <InputNumber
                        id="priority"
                        value={localTheme.priority as number | null}
                        onChange={(e) =>
                            setLocalTheme({ ...localTheme, priority: e.value || 0 })
                        }
                        required
                        className={classNames({
                            'p-invalid':
                                submitted &&
                                localTheme.priority == null,
                        })}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveDialog;
