'use client';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { Permission } from '../models/permission.model';
import { PermissionApi } from '../api/permission.api';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SavePermission = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<Permission>) => {

    const toast = useRef<Toast>(null);
    const [localPermission, setLocalPermission] = useState<Permission>({ ...item });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setLocalPermission({ ...item });
    }, [item]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        setLocalPermission({ ...item });
    };

    const validate = (permission: Permission) => {
        if (!permission.category) return { valid: false, message: 'Category is required' };
        if (!permission.name) return { valid: false, message: 'Name is required' };
        if (!permission.description) return { valid: false, message: 'Description is required' };
        return { valid: true };
    };

    const savePermission = async () => {
        setSubmitted(true);

        try {
            const validation = validate(localPermission);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const saved = localPermission._id
                ? await PermissionApi.update(localPermission)
                : await PermissionApi.create(localPermission);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Permission saved successfully',
                life: 2000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save Permission',
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
            <Button label="Save" icon="pi pi-check" text onClick={savePermission} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '450px' }}
                header={localPermission._id ? 'Edit Permission' : 'New Permission'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                <div className="field">
                    <label htmlFor="category">Category</label>
                    <InputText
                        id="category"
                        value={localPermission.category}
                        onChange={(e) =>
                            setLocalPermission({ ...localPermission, category: e.target.value })
                        }
                        className={classNames({
                            'p-invalid': submitted && !localPermission.category
                        })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="name">Name</label>
                    <InputText
                        id="name"
                        value={localPermission.name}
                        onChange={(e) =>
                            setLocalPermission({ ...localPermission, name: e.target.value })
                        }
                        className={classNames({
                            'p-invalid': submitted && !localPermission.name
                        })}
                    />
                </div>

                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputText
                        id="description"
                        value={localPermission.description}
                        onChange={(e) =>
                            setLocalPermission({ ...localPermission, description: e.target.value })
                        }
                        className={classNames({
                            'p-invalid': submitted && !localPermission.description
                        })}
                    />
                </div>
            </Dialog>
        </>
    );
};

export default SavePermission;