'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { User } from '@/models/user';
import { Role } from '@/models/role';

interface RoleCompProps {
    user: User;
}

const RoleComp = (props: RoleCompProps) => {
    let emptyRole: Role = {
        role_name: '',
        permissions:[]
    };


    const [roles, setRoles] = useState<Role[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedRole, setSelectedRole] = useState<Role>(emptyRole);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        setRoles(props.user.roles);
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const saveRole = async () => {
        try {
            let _roles = [...(roles as any)];
            if (selectedRole._id) {
                //const updatedRole = await RoleService.updateRole(selectedRole);
                //const index = roles.findIndex((role) => role._id === selectedRole._id);
                //_roles[index] = updatedRole;
            } else {
                //const newRole = await RoleService.createRole(selectedRole);
                //_roles.push(newRole);
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Role ${selectedRole._id ? "updated" : 'created'}`,
                life: 3000
            });
            setRoles(_roles);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedRole._id ? "update" : 'create'} role`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedRole(emptyRole);
        }

    };


    const deleteRole = async () => {
        try {
            //const deleted = await RoleService.deleteRole(selectedRole);
            const deleted = false;
            if (deleted) {
                let _roles = (roles as any)?.filter((val: any) => val._id !== selectedRole._id);
                setRoles(_roles);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Role Deleted',
                    life: 3000
                });
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete roles',
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedRole(emptyRole);
        }

    };

    const openSaveDialog = (role: Role) => {
        setSelectedRole({ ...role });
        setShowSaveDialog(true);
    };


    const hideSaveDialog = () => {
        setShowSaveDialog(false);
        setSelectedRole(emptyRole);
    };

    const confirmDeleteItem = (role: Role) => {
        setSelectedRole(role);
        setShowDeleteDialog(true);
    };

    const startToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New Role" icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptyRole)} />
                </div>
            </React.Fragment>
        );
    };



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Roles</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Role) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => openSaveDialog(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => confirmDeleteItem(rowData)} />
            </>
        );
    };

    


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
                        emptyMessage={`No role data found for ${props.user.user_name}.`}
                        header={header}
                        scrollable
                        filters={filters}
                        
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="role_name" header="Role Name" sortable headerStyle={{ minWidth: '15rem' }} />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>
                    
                    {selectedRole &&
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={selectedRole.role_name}
                            onDelete={deleteRole}
                            onHide={() => setShowDeleteDialog(false)}
                        />}
                </div>
            </div>
        </div>
    );
};

export default RoleComp;
