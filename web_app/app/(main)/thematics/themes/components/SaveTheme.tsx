'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';

import { ThemeApi } from '../api/theme.api';
import { Theme, validateTheme } from '../models/theme.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SaveTheme = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Theme>) => {

    const toast = useRef<Toast>(null);

    const [localTheme, setLocalTheme] = useState<Theme>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalTheme({ ...item });
    }, [item]);

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setLocalTheme({ ...item });
        }
    }, [visible]);

    const saveTheme = async () => {
        setSubmitted(true);

        const validation = validateTheme(localTheme);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'error',
                summary: 'Validation',
                detail: validation.message,
            });
            return;
        }

        try {
            let saved = localTheme._id
                ? await ThemeApi.update(localTheme)
                : await ThemeApi.create(localTheme);

            // keep relational fields (same as your old logic)
            saved = {
                ...saved,
                thematicArea: localTheme.thematicArea,
                parent: localTheme.parent
            };

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Theme saved successfully',
            });

            if (onComplete) onComplete(saved);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Theme',
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" onClick={saveTheme} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                header={localTheme._id ? 'Edit Theme' : 'New Theme'}
                modal
                className="p-fluid"
                style={{ width: '500px' }}
                footer={footer}
                onHide={onHide}
            >

                {/* Title */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localTheme.title}
                        onChange={(e) =>
                            setLocalTheme({ ...localTheme, title: e.target.value })
                        }
                        required
                        autoFocus
                        className={classNames({
                            'p-invalid': submitted && !localTheme.title
                        })}
                    />
                </div>

                {/* Priority */}
                <div className="field">
                    <label htmlFor="priority">Priority</label>
                    <InputNumber
                        id="priority"
                        value={localTheme.priority as number | null}
                        onValueChange={(e) =>
                            setLocalTheme({
                                ...localTheme,
                                priority: e.value ?? 0
                            })
                        }
                        className={classNames({
                            'p-invalid': submitted && localTheme.priority == null
                        })}
                    />
                </div>

            </Dialog>
        </>
    );
};

export default SaveTheme;