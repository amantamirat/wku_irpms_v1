'use client';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

import { UserApi } from '../../api/user.api';
import { User, IOwnership } from '../../models/user.model';
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';

interface OwnershipDialogProps {
    visible: boolean;
    item: User;
    onHide: () => void;
    onComplete?: (saved: User) => void;
}

const OwnershipDialog = ({ visible, item, onHide, onComplete }: OwnershipDialogProps) => {
    const toast = useRef<Toast>(null);
    const confirm = useConfirmDialog();
    
    const [ownerships, setOwnerships] = useState<IOwnership[]>([]);
    const [orgOptions, setOrgOptions] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initial Data Sync
    useEffect(() => {
        if (visible) {
            setOwnerships(item.ownerships || []);
        }
    }, [item, visible]);

    // Load options when ownerships change
    useEffect(() => {
        ownerships.forEach(o => {
            if (o.unitType && !orgOptions[o.unitType]) {
                fetchOrgs(o.unitType);
            }
        });
    }, [ownerships]);

    const fetchOrgs = async (unitType: OrgnUnit) => {
        try {
            const data = await OrganizationApi.getAll({ type: unitType });
            setOrgOptions(prev => ({ ...prev, [unitType]: data }));
        } catch (err) {
            console.error("Failed to load organizations", err);
        }
    };

    const updateOwnership = (index: number, patch: Partial<IOwnership>) => {
        const updated = [...ownerships];
        updated[index] = { ...updated[index], ...patch };
        setOwnerships(updated);
    };

    const addOwnership = (unitType: OrgnUnit) => {
        if (ownerships.some(o => o.unitType === unitType)) {
            toast.current?.show({ severity: 'warn', summary: 'Duplicate', detail: 'This unit type is already added.' });
            return;
        }
        setOwnerships([...ownerships, { unitType, scope: [] }]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await UserApi.updateOwnerships(item._id!, ownerships);
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Permissions updated' });
            onComplete?.({ ...saved, workspace: item.workspace });
            onHide();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message });
        } finally {
            setSaving(false);
        }
    };

    // Table Templates
    const unitTemplate = (rowData: IOwnership) => (
        <Tag value={rowData.unitType} severity="info" style={{ fontSize: '0.8rem' }} />
    );

    const scopeTemplate = (rowData: IOwnership, { rowIndex }: any) => {
        const isFullAccess = rowData.scope === '*';
        
        return (
            <div className="flex align-items-center gap-3">
                <div className="flex-grow-1">
                    {isFullAccess ? (
                        <InputText value="All Organizations" disabled className="w-full p-inputtext-sm" />
                    ) : (
                        <MultiSelect
                            value={rowData.scope}
                            options={orgOptions[rowData.unitType] || []}
                            onChange={(e) => updateOwnership(rowIndex, { scope: e.value })}
                            optionLabel="name"
                            optionValue="_id"
                            placeholder="Select Scopes"
                            display="chip"
                            className="w-full p-inputtext-sm"
                            maxSelectedLabels={3}
                            filter
                        />
                    )}
                </div>
                <div className="flex align-items-center gap-2" style={{ minWidth: '110px' }}>
                    <Checkbox
                        inputId={`full_access_${rowIndex}`}
                        checked={isFullAccess}
                        onChange={(e) => updateOwnership(rowIndex, { scope: e.checked ? '*' : [] })}
                    />
                    <label htmlFor={`full_access_${rowIndex}`} className="text-sm">Full Access</label>
                </div>
            </div>
        );
    };

    const actionTemplate = (rowData: IOwnership) => (
        <Button
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            onClick={() => confirm.ask({
                item: rowData.unitType,
                onConfirm: () => setOwnerships(prev => prev.filter(o => o.unitType !== rowData.unitType))
            })}
        />
    );

    const footer = (
        <div className="flex justify-content-between align-items-center w-full">
            <Dropdown
                options={Object.values(OrgnUnit)}
                placeholder="Add Unit Type..."
                onChange={(e) => addOwnership(e.value)}
                className="p-inputtext-sm w-12rem"
            />
            <div>
                <Button label="Cancel" icon="pi pi-times" text onClick={onHide} disabled={saving} />
                <Button label="Save Changes" icon="pi pi-check" onClick={handleSave} loading={saving} />
            </div>
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-sitemap text-primary"></i>
                        <span>Manage Ownerships: <b>{item.name}</b></span>
                    </div>
                }
                style={{ width: '800px' }}
                modal
                footer={footer}
                onHide={onHide}
            >
                <div className="card border-none p-0 mt-2">
                    <DataTable 
                        value={ownerships} 
                        emptyMessage="No ownerships assigned yet. Use the dropdown below to add one."
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                    >
                        <Column field="unitType" header="Unit Type" body={unitTemplate} style={{ width: '15%' }} />
                        <Column header="Access Scope" body={scopeTemplate} style={{ width: '75%' }} />
                        <Column body={actionTemplate} style={{ width: '10%' }} />
                    </DataTable>
                </div>
            </Dialog>
        </>
    );
};

export default OwnershipDialog;