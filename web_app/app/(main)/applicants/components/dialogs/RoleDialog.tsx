'use client';
import { RoleApi } from '@/app/(main)/roles/api/role.api';
import { Role } from '@/app/(main)/roles/models/role.model';
import { useAuth } from '@/contexts/auth-context';
import { PERMISSIONS } from '@/types/permissions';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { useEffect, useRef, useState } from 'react';
import { ApplicantApi } from '../../api/applicant.api';
import { Applicant, validateApplicant } from '../../models/applicant.model';

interface RoleDialogProps {
    visible: boolean;
    applicant: Applicant;
    onHide: () => void;
    onComplete?: (savedApplicant: Applicant) => void;
}

const RoleDialog = ({ visible, applicant, onHide, onComplete }: RoleDialogProps) => {

    const { getOrganizationsByType, hasPermission } = useAuth();
    const canReadRoles = hasPermission([PERMISSIONS.ROLE.READ]);

    const [localApplicant, setLocalApplicant] = useState<Applicant>({ ...applicant });
    const [roles, setRoles] = useState<Role[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (!canReadRoles) {
            return;
        }
        const fetchRoles = async () => {
            try {
                const rolesData = await RoleApi.getRoles();
                setRoles(rolesData);
            } catch (err) {
                console.error('Failed to fetch roles:', err);
            }
        };
        fetchRoles();
    }, []);

    useEffect(() => {
        setLocalApplicant({ ...applicant });
    }, [applicant]);

    useEffect(() => {
        if (!visible) clearForm();
    }, [visible]);

    const clearForm = () => {
        setSubmitted(false);
        //setErrorMessage(undefined);
        setLocalApplicant({ ...applicant });
    };

    const saveApplicant = async () => {
        try {
            setSubmitted(true);
            const validation = validateApplicant(localApplicant);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            let saved = await ApplicantApi.updateRoles(localApplicant);
            saved = {
                ...saved,
                workspace: localApplicant.workspace
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Applicant saved successfully',
                life: 2000,
            });
            if (onComplete) setTimeout(() => onComplete(saved), 2000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save applicant',
                detail: err.message || 'An error occurred',
                life: 2000,
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveApplicant} />
        </>
    );

    const isEdit = !!localApplicant._id;

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '600px' }}
                header={"Applicant Role's"}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
                maximizable
            >
                <div className="field">
                    <label htmlFor="name">Full Name</label>
                    <InputText
                        id="name"
                        value={localApplicant.name}
                        disabled
                    />
                </div>

                <div className="field">
                    <label htmlFor="email">Email</label>
                    <InputText
                        id="email"
                        value={localApplicant.email}
                        disabled
                    />
                </div>

                {(canReadRoles && isEdit) && <>
                    <div className="field">
                        <label htmlFor="roles">Roles</label>
                        <MultiSelect
                            id="roles"
                            //dataKey="_id"
                            optionLabel="name"
                            optionValue="_id"
                            value={localApplicant.roles}
                            options={roles}
                            onChange={(e) => setLocalApplicant({ ...localApplicant, roles: e.value })}
                            placeholder="select roles"
                            display="chip"
                        />
                    </div>
                </>
                }
            </Dialog>
        </>
    );
};

export default RoleDialog;
