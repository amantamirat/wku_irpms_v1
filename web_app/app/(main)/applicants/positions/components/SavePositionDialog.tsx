'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { Position, validatePosition, PositionType } from '../models/position.model';
import { PositionApi } from '../api/position.api';
import { applicantUnits } from '../../models/applicant.model';
//import { scopeOptions } from '../../models/applicant.model';


interface SavePositionDialogProps {
    visible: boolean;
    position: Position;
    onComplete: (pos: Position) => void;
    onHide: () => void;
}

const SavePositionDialog = (props: SavePositionDialogProps) => {
    const { visible, position, onComplete, onHide } = props;
    const toast = useRef<Toast>(null);

    const [localPosition, setLocalPosition] = useState<Position>({ ...position });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
        setLocalPosition({ ...position });
    }, [position]);

    const savePosition = async () => {
        try {
            setSubmitted(true);
            const validation = validatePosition(localPosition);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Position;
            if (localPosition._id) {
                saved = await PositionApi.updatePosition(localPosition);
            } else {
                saved = await PositionApi.createPosition(localPosition);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: `${position.type} saved successfully`,
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: `Failed to save ${position.type}`,
                detail: err.message || String(err),
                life: 2000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={savePosition} />
        </>
    );

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalPosition({ ...position });
    };




    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localPosition._id ?
                    `Edit ${localPosition.type}` :
                    `New ${localPosition.type}`}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                {/*                
                <div className="field">
                    <label htmlFor="type">Type</label>
                    <Dropdown
                        id="type"
                        value={localPosition.type}
                        options={posTypeOptions}
                        onChange={(e) => setLocalPosition({ ...localPosition, type: e.value })}
                        placeholder="Select Type"
                        className={classNames({ 'p-invalid': submitted && !localPosition.type })}
                    />
                    {submitted && !localPosition.type && (
                        <small className="p-invalid">Type is required.</small>
                    )}
                </div>
                */}
                {/* Name */}
                <div className="field">
                    <label htmlFor="name">Name</label>
                    <InputText
                        id="name"
                        value={localPosition.name}
                        onChange={(e) => setLocalPosition({ ...localPosition, name: e.target.value })}
                        required
                        className={classNames({ 'p-invalid': submitted && !localPosition.name })}
                    />
                    {submitted && !localPosition.name && (
                        <small className="p-invalid">Name is required.</small>
                    )}
                </div>

                {/* Category (for Position type only) */}
                {localPosition.type === PositionType.position && (
                    <div className="field">
                        <label htmlFor="category">Category (Scope)</label>
                        <Dropdown
                            id="category"
                            value={localPosition.category}
                            options={applicantUnits}
                            onChange={(e) =>
                                setLocalPosition({ ...localPosition, category: e.value })
                            }
                            placeholder="Select Category"
                            className={classNames({
                                'p-invalid': submitted && !localPosition.category,
                            })}
                        />
                        {submitted && !localPosition.category && (
                            <small className="p-invalid">Category is required.</small>
                        )}
                    </div>
                )}

                {errorMessage && <small className="p-error">{errorMessage}</small>}
            </Dialog>
        </>
    );
};

export default SavePositionDialog;
