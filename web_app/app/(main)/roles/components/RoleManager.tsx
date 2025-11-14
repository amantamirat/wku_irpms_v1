'use client';

import ConfirmDialog from '@/components/ConfirmationDialog';
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

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const data = await RoleApi.getRoles();
                setRoles(data);
            } catch (err) {
                console.error("Failed to fetch roles:", err);
            }
        };
        fetchRoles();
    }, []);

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

    const onSaveComplete = (savedRole: Role) => {
        let _roles = [...roles]; // roles is your local state array of Role
        const index = _roles.findIndex((u) => u._id === savedRole._id);
        if (index !== -1) {
            // Replace existing role
            _roles[index] = { ...savedRole };
        } else {
            // Add new role
            _roles.push({ ...savedRole });
        }
        setRoles(_roles); // update state
        hideDialogs();    // close your SaveRoleDialog
    };

    const deleteRole = async () => {
        const deleted = await RoleApi.deleteRole(selectedRole);
        if (deleted) {
            setRoles(roles.filter((c) => c._id !== selectedRole._id));
        }
        hideDialogs();
    };

    const hideDialogs = () => {
        setShowDeleteDialog(false);
        setShowSaveDialog(false);
        setSelectedRole(emptyRole);
    }

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
                        <Column header="Permissions"
                            body={(rowData) => rowData.permissions?.length || 0}
                            style={{ width: '150px', textAlign: 'center' }}
                        />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedRole && (
                        <SaveDialog
                            visible={showSaveDialog}
                            role={selectedRole}
                            onComplete={onSaveComplete}
                            onHide={hideDialogs}
                        />
                    )}

                    {selectedRole && (
                        <ConfirmDialog
                            showDialog={showDeleteDialog}
                            item={String(selectedRole.role_name)}
                            onConfirmAsync={deleteRole}
                            onHide={() => setShowDeleteDialog(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoleManager;
