'use client';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { UserApi } from '../../api/user.api';
import { User, IOwnership } from '../../models/user.model';
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';

interface OwnershipDialogProps {
    visible: boolean;
    applicant: User;
    onHide: () => void;
    onComplete?: (saved: User) => void;
}

const OwnershipDialog = ({ visible, applicant, onHide, onComplete }: OwnershipDialogProps) => {

    const toast = useRef<Toast>(null);

    const confirm = useConfirmDialog();

    const [ownerships, setOwnerships] = useState<IOwnership[]>(applicant.ownerships || []);

    const [orgOptions, setOrgOptions] = useState<Record<OrgnUnit, any[]>>({} as Record<OrgnUnit, any[]>);

    const [showDialog, setShowDialog] = useState(false);

    const loadOrganizations = async (unitType: OrgnUnit) => {
        if (orgOptions[unitType]) return;

        const data = await OrganizationApi.getAll({ type: unitType });
        setOrgOptions(prev => ({
            ...prev,
            [unitType]: data
        }));
    };

    useEffect(() => {
        ownerships.forEach(o => {
            if (o.unitType) {
                loadOrganizations(o.unitType);
            }
        });
    }, [ownerships]);

    useEffect(() => {
        setOwnerships(applicant.ownerships || []);
    }, [applicant]);

    const updateOwnership = (index: number, patch: Partial<IOwnership>) => {
        setOwnerships(prev =>
            prev.map((o, i) => i === index ? { ...o, ...patch } : o)
        );
    };

    const saveOwnerships = async () => {
        try {
            let saved = await UserApi.updateOwnerships(applicant._id!, {
                ownerships
            });
            saved = {
                ...saved,
                workspace: applicant.workspace
            };
            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Ownerships updated successfully',
                life: 2000
            });

            if (onComplete) {
                setTimeout(() => onComplete(saved), 1500);
            }

        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed',
                detail: err.message || 'Error updating ownerships',
                life: 3000
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveOwnerships} />
        </>
    );

    const removeOwnership = (unitType: OrgnUnit) => {
        setOwnerships(prev => prev.filter(o => o.unitType !== unitType));
    };

    const addOwnership = (unitType: OrgnUnit) => {
        setOwnerships(prev => {
            const exists = prev.some(o => o.unitType === unitType);
            if (exists) return prev;
            return [
                ...prev,
                { unitType, scope: [] }
            ];
        });
    };

    interface UnitDialogProps {
        visible: boolean;
        onHide: () => void;
    }
    const UnitDialog = ({ visible, onHide }: UnitDialogProps) => {
        const [unit, setUnit] = useState<OrgnUnit | null>(null);

        const footer = (
            <>
                <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
                <Button label="Add" icon="pi pi-check" text onClick={() => {
                    if (!unit) return;
                    addOwnership(unit);
                    onHide();
                }} />
            </>
        );
        return (
            <Dialog visible={visible} style={{ width: '350px' }} onHide={() => { onHide(); }} footer={footer}>
                <div className="flex justify-content-center">
                    <Dropdown
                        value={unit}
                        options={Object.values(OrgnUnit)}
                        placeholder="Unit Type"
                        style={{ width: '100%' }}
                        onChange={(e) => setUnit(e.value)}
                    />
                </div>
            </Dialog>
        )
    }

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                header="Applicant Ownerships"
                style={{ width: '600px' }}
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
                maximizable
            >
                {/* Applicant Info */}
                <div className="field">
                    <label>Name</label>
                    <InputText value={applicant.name} disabled />
                </div>

                {/* Ownerships */}
                <div className="field">
                    <label>Ownerships</label>

                    {ownerships.map((o, index) => (
                        <div key={index}
                            className="grid align-items-center gap-2 mb-2">
                            {/* Unit */}
                            <div className="flex-1">
                                <InputText
                                    value={o.unitType}
                                    disabled={true}
                                />
                            </div>

                            {/* Scope */}
                            <div className="flex-2">
                                {o.scope === '*' ? (
                                    <InputText
                                        value="Full Access"
                                        disabled
                                    />
                                ) : (
                                    <MultiSelect
                                        value={o.scope}
                                        options={orgOptions[o.unitType] || []}
                                        optionLabel="name"
                                        optionValue="_id"
                                        //display="chip"
                                        onChange={(e) =>
                                            updateOwnership(index, { scope: e.value })
                                        }
                                    />
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex-1">
                                {
                                    <Checkbox
                                        checked={o.scope === '*'}
                                        onChange={(e) =>
                                            updateOwnership(index, {
                                                scope: e.checked ? '*' : []
                                            })
                                        }
                                        tooltip="Grant full access"
                                    />
                                }
                            </div>
                            <div className='flex-1'>
                                <Button
                                    icon="pi pi-trash"
                                    text
                                    severity="danger"
                                    onClick={() => confirm.ask({
                                        item: `remove ${o.unitType}`,
                                        onConfirm: () => removeOwnership(o.unitType)
                                    })}
                                />
                            </div>
                        </div>
                    ))}

                    {//canUpdateOwnerships && (
                        <Button
                            label="Add Ownership"
                            icon="pi pi-plus"
                            text
                            onClick={() => { setShowDialog(true); }}
                        />
                        //)
                    }
                </div>
            </Dialog>
            <UnitDialog
                visible={showDialog}
                onHide={() => setShowDialog(false)} />
        </>
    );
};

export default OwnershipDialog;
