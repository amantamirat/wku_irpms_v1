'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Grant, validateGrant } from '../models/grant.model';
import { Organization, OrganizationalUnit } from '../../organizations/models/organization.model';
import { OrganizationApi } from '../../organizations/api/organization.api';
import { Dropdown } from 'primereact/dropdown';
import { GrantApi } from '../api/grant.api';
import { Toast } from 'primereact/toast';

interface SaveDialogProps {
    visible: boolean;
    grant: Grant;
    onComplete?: (savedGrant: Grant) => void;
    onHide: () => void;
}

const SaveDialog = ({ visible, grant, onComplete, onHide }: SaveDialogProps) => {
    const toast = useRef<Toast>(null);
    const [localGrant, setLocalGrant] = useState<Grant>({ ...grant });
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const data = await OrganizationApi.getOrganizations({ type: OrganizationalUnit.Directorate });
                setOrganizations(data);
            } catch (err) {
                console.error('Failed to fetch organizations:', err);
            }
        };
        fetchOrganizations();
    }, []);

    useEffect(() => {
        setLocalGrant({ ...grant });
    }, [grant]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        setLocalGrant({ ...grant });
    };

    const saveGrant = async () => {
        try {
            setSubmitted(true);
            const validation = validateGrant(localGrant);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved: Grant;
            if (localGrant._id) {
                saved = await GrantApi.updateGrant(localGrant);
            } else {
                saved = await GrantApi.createGrant(localGrant);
            }
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
            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save Grant',
                detail: err.message || 'An error occurred',
                life: 2000,
            });
        }
    };

    const hide = () => {
        setSubmitted(false);
        setErrorMessage(undefined);
        onHide();
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveGrant} />
        </>
    );

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
            setErrorMessage(undefined);
        }
    }, [visible]);


    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px', height: '400px' }}
                header={localGrant._id ? 'Edit Grant' : 'Create New Grant'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
                //maximizable
            >
                <div className="field">
                    <label htmlFor="organization">
                        Directorate
                    </label>
                    <Dropdown
                        id="organization"
                        value={localGrant.directorate}
                        options={organizations}
                        optionLabel="name"
                        onChange={(e) => setLocalGrant({ ...localGrant, directorate: e.value })}
                        placeholder="Select Organization"
                        className={classNames({ 'p-invalid': submitted && !localGrant.directorate })}
                    />
                </div>

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

                <div className="field">
                    <label htmlFor="description">Description </label>
                    <InputTextarea
                        value={localGrant.description ?? ""}
                        onChange={(e) => setLocalGrant({ ...localGrant, description: e.target.value })}
                        rows={5}
                        cols={30} />
                </div>
                {errorMessage && (
                    <small className="p-error">{errorMessage}</small>
                )}
            </Dialog>
        </>
    );
}

export default SaveDialog;
