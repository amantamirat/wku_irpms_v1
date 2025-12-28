'use client';
import { useAuth } from '@/contexts/auth-context';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Organization, OrgnUnit } from '../../organizations/models/organization.model';
import { GrantApi } from '../api/grant.api';
import { Grant, validateGrant } from '../models/grant.model';

interface SaveDialogProps {
    visible: boolean;
    grant: Grant;
    directorates?: Organization[]
    onComplete?: (savedGrant: Grant) => void;
    onHide: () => void;
}

const SaveDialog = ({ visible, grant, directorates, onComplete, onHide }: SaveDialogProps) => {
    
    const toast = useRef<Toast>(null);

    const [localGrant, setLocalGrant] = useState<Grant>({ ...grant });
    const [submitted, setSubmitted] = useState(false); 

    useEffect(() => {
        setLocalGrant({ ...grant });
    }, [grant]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalGrant({ ...grant });
    };

    const saveGrant = async () => {
        setSubmitted(true);
        try {
            const validation = validateGrant(localGrant);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            let saved = localGrant._id
                ? await GrantApi.updateGrant(localGrant)
                : await GrantApi.createGrant(localGrant);
            saved = {
                ...saved,
                directorate: localGrant.directorate
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Grant saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Grant',
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
            <Button label="Save" icon="pi pi-check" text onClick={saveGrant} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={localGrant._id ? 'Edit Grant' : 'New Grant'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* Directorate Selector */}
                <div className="field">
                    <label htmlFor="directorate">Directorate</label>
                    <Dropdown
                        id="directorate"
                        value={localGrant.directorate}
                        options={directorates}
                        optionLabel="name"
                        onChange={(e) => setLocalGrant({ ...localGrant, directorate: e.value })}
                        placeholder="Select Directorate"
                        className={classNames({ 'p-invalid': submitted && !localGrant.directorate })}
                    />
                </div>

                {/* Title Field */}
                <div className="field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        value={localGrant.title}
                        onChange={(e) => setLocalGrant({ ...localGrant, title: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !localGrant.title })}
                    />
                </div>

                {/* Description Field */}
                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        value={localGrant.description ?? ''}
                        onChange={(e) => setLocalGrant({ ...localGrant, description: e.target.value })}
                        rows={4}
                        cols={30}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SaveDialog;
