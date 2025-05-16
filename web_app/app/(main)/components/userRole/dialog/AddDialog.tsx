'use client';

import { Role } from '@/models/role';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { useEffect, useState } from 'react';

interface AddDialogProps {
    visible: boolean;
    roles: Role[];
    role: Role;
    onChange: (role: Role) => void;
    onAdd: () => void;
    onHide: () => void;
}

function AddDialog(props: AddDialogProps) {
    const { visible, roles, role, onChange, onAdd, onHide } = props;
    const [submitted, setSubmitted] = useState(false);


    const save = async () => {
        setSubmitted(true);

        onAdd();
    }

    const hide = async () => {
        setSubmitted(false);
        onHide();
    }

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" severity='danger' text onClick={hide} />
            <Button label="Add" icon="pi pi-check" severity='info' text onClick={save} />
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
            header={'Add Role'}
            modal
            className="p-fluid"
            footer={footer}
            onHide={hide}
        >
            {role && (
                <div className="field">
                    <label htmlFor="role">Role Name</label>
                    <Dropdown
                        id="role"
                        value={role}
                        optionLabel='role_name'
                        options={roles}
                        onChange={(e) => onChange({ ...e.target.value })}
                        placeholder="Select a Role"
                        required
                        autoFocus
                        className={classNames({ 'p-invalid': submitted && !role })}
                    />
                    {submitted && !role && (
                        <small className="p-invalid">Role is required.</small>
                    )}
                </div>
            )}
        </Dialog>
    );
}

export default AddDialog;
