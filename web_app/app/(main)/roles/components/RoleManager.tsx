'use client';

import DeleteDialog from '@/components/DeleteDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RoleApi } from '../api/role.api';
import { Role } from '../models/role.model';
import SaveDialog from './SaveDialog';





const RoleManager = () => {

    const emptyRole: Role = {
        role_name: '',
        permissions: []
    };

    const [roles, setRoles] = useState<Role[]>([]);
    const [error, setError] = useState<string | null>(null);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedRole, setSelectedRole] = useState<Role>(emptyRole);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    const loadRoles = useCallback(async () => {
        try {
            const data = await RoleApi.getRoles();
            setRoles(data);
        } catch (err) {
            setError(`Failed to load grant data ${err}`);
        } finally {

        }
    }, [error]);

    useEffect(() => {
        loadRoles();
    }, [loadRoles]);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);


    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    if (error) {
        return (
            <div className="flex align-items-center justify-content-center py-6">
                <div className="text-center">
                    <i className="pi pi-exclamation-triangle text-4xl text-500 mb-3" />
                    <p className="text-500 mb-4">{error}</p>
                    <Button
                        label="Retry"
                        icon="pi pi-refresh"
                        onClick={() => window.location.reload()}
                    />
                </div>
            </div>
        );
    }

    const saveRole = async () => {
        try {
            let _roles = [...roles];
            if (selectedRole._id) {
                const updated = await RoleApi.updateRole(selectedRole);
                const index = _roles.findIndex((c) => c._id === selectedRole._id);
                _roles[index] = { ...updated, permissions: selectedRole.permissions };
            } else {
                const created = await RoleApi.createRole(selectedRole);
                _roles.push({ ...selectedRole, _id: created._id });
            }
            setRoles(_roles);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Role ${selectedRole._id ? 'updated' : 'created'}`,
                life: 3000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save role',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedRole(emptyRole);
        }
    };

    const deleteRole = async () => {
        try {
            const deleted = await RoleApi.deleteRole(selectedRole);
            if (deleted) {
                setRoles(roles.filter((c) => c._id !== selectedRole._id));
                toast.current?.show({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Role deleted',
                    life: 3000
                });
            }
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete role',
                detail: '' + err,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedRole(emptyRole);
        }
    };

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button label="New Role" icon="pi pi-plus" severity="success" className="mr-2"
                onClick={() => {
                    setSelectedRole(emptyRole);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Roles</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Role) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedRole(rowData);
                    setShowSaveDialog(true);
                }} />
            <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setSelectedRole(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
                    <DataTable
                        ref={dt}
                        value={roles}
                        selection={selectedRole}
                        onSelectionChange={(e) => setSelectedRole(e.value as Role)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} roles"
                        globalFilter={globalFilter}
                        emptyMessage="No role data found."
                        header={header}
                        scrollable
                        filters={filters}
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                        <Column field="role_name" header="Role Name" sortable />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedRole && (
                        <SaveDialog
                            visible={showSaveDialog}
                            role={selectedRole}
                            onChange={setSelectedRole}
                            onSave={saveRole}
                            onHide={() => setShowSaveDialog(false)}
                        />
                    )}

                    {selectedRole && (
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={String(selectedRole.role_name)}
                            onDelete={deleteRole}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoleManager;
