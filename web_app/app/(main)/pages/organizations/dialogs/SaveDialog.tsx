'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Organization, } from '@/models/organization';

interface SaveDialogProps {
    visible: boolean;
    organization: Organization;
    onChange: (organization: Organization) => void;
    onSave: () => void;
    onHide: () => void;
}

function SaveDialog(props: SaveDialogProps) {
    const { visible, organization, onChange, onSave, onHide } = props;
    const [submitted, setSubmitted] = useState(false);

    const save = async () => {
        setSubmitted(true);
        // if (!validateOrganization(organization)) {
        // return;
        //}
        onSave();
    }

    const hide = async () => {
        setSubmitted(false);
        onHide();
    }

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} />
            <Button label="Save" icon="pi pi-check" text onClick={save} />
        </>
    );

    useEffect(() => {
        if (!visible) {
            setSubmitted(false);
        }
    }, [visible]);

    return (
        <Dialog
            visible={visible}
            style={{ width: '450px' }}
            header={organization._id ? `Edit ${organization.type} Details` : `New ${organization.type} Details`}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        //position={organization._id ? 'right' : 'center'}
        >
            {organization && (
                <div className="field">
                    <label htmlFor="name">Organization Name</label>
                    <InputText
                        id="name"
                        value={organization.name}
                        onChange={(e) => onChange({ ...organization, name: e.target.value })}
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !organization.name })}
                    />
                    {submitted && !organization.name && (
                        <small className="p-invalid">Name is required.</small>
                    )}
                </div>
            )}
        </Dialog>
    );
}

export default SaveDialog;
