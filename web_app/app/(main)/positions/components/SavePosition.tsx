'use client';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { PositionApi } from '../api/position.api';
import { Position, validatePosition } from '../models/position.model';

const SavePositionDialog = (props: EntitySaveDialogProps<Position>) => {
    const { visible, item, onComplete, onHide } = props;

    const toast = useRef<Toast>(null);

    const [localPosition, setLocalPosition] = useState<Position>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    /* =========================
       Sync item → local state
    ========================= */
    useEffect(() => {
        setLocalPosition({ ...item });
        setSubmitted(false);
    }, [item, visible]);

    /* =========================
       Save handler
    ========================= */
    const savePosition = async () => {
        try {
            setSubmitted(true);

            const validation = validatePosition(localPosition);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            setLoading(true);

            let saved: Position;
            if (localPosition._id) {
                saved = await PositionApi.update(localPosition);
            } else {
                saved = await PositionApi.create(localPosition);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: `Position ${localPosition._id ? 'updated' : 'created'} successfully`,
                life: 2000,
            });

            onComplete?.(saved);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save position',
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    /* =========================
       Footer
    ========================= */
    const footer = (
        <>
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                onClick={onHide}
                disabled={loading}
            />
            <Button
                label="Save"
                icon="pi pi-check"
                onClick={savePosition}
                loading={loading}
            />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={localPosition._id ? 'Edit Position' : 'New Position'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {/* Name Field */}
                <div className="field">
                    <label htmlFor="name" className="font-medium">
                        Name
                    </label>
                    <InputText
                        id="name"
                        value={localPosition.name}
                        onChange={(e) =>
                            setLocalPosition({
                                ...localPosition,
                                name: e.target.value,
                            })
                        }
                        autoFocus
                        className={classNames({
                            'p-invalid': submitted && !localPosition.name,
                        })}
                    />
                    {submitted && !localPosition.name && (
                        <small className="p-error">
                            Name is required.
                        </small>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SavePositionDialog;