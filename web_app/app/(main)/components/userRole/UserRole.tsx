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
import { Role } from '@/models/role';
import AddDialog from './dialog/AddDialog';
import { UserApi } from '@/services/UserService';
import { User } from '../../users/models/user.model';

interface UserRoleCompProps {
    roles: Role[];
    user: User;
    onUpdate: (updated: User) => void;
}

const UserRoleComp = (props: UserRoleCompProps) => {

    const { roles, user, onUpdate } = props;

    const unassignedRoles = roles.filter((role) => {
        return !user.roles.some((r) =>
            (typeof r === 'string' ? r : r._id) === role._id
        );
    });

    let emptyRole: Role = {
        role_name: '',
        permissions: []
    };

    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedRole, setSelectedRole] = useState<Role>(emptyRole);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const addRole = async () => {
        try {
            const alreadyExists = user.roles.some((r: any) =>
                (typeof r === 'string' ? r : r._id) === selectedRole._id);
            if (alreadyExists) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Duplicate Role',
                    detail: 'This role is already assigned to the user.',
                    life: 3000
                });
                return;
            }
            let _roles = [...(user.roles)];
            if (selectedRole._id) {
                await UserApi.addRole(user, selectedRole);
                _roles.push(selectedRole);
                onUpdate({ ...user, roles: _roles });
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'Role Added!',
                    life: 3000
                });

            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedRole._id ? "update" : 'create'} role`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowAddDialog(false);
            setSelectedRole(emptyRole);
        }
    };


    const deleteRole = async () => {
        try {

            await UserApi.removeRole(user, selectedRole);
            let _roles = (user.roles)?.filter((val) => val._id !== selectedRole._id);
            onUpdate({ ...user, roles: _roles });
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Role Removed',
                life: 3000
            });

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

    const openAddDialog = (role: Role) => {
        setSelectedRole({ ...role });
        setShowAddDialog(true);
    };


    const hideAddDialog = () => {
        setShowAddDialog(false);
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
                    <Button label="Add Role" icon="pi pi-plus" severity="secondary" outlined className="mr-2" onClick={() => openAddDialog(emptyRole)} />
                </div>
            </React.Fragment>
        );
    };



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">User {props.user.user_name} Roles</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: Role) => {
        return (
            <>
                <Button icon="pi pi-times" rounded severity="danger" className="p-button-rounded p-button-text"
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
                        value={user.roles}
                        selection={selectedRole}
                        onSelectionChange={(e) => setSelectedRole(e.value as Role)}
                        dataKey="_id"
                        paginator
                        rows={5}
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
                        <Column field="role_name" header="Role" sortable headerStyle={{ minWidth: '15rem' }} />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedRole &&
                        <AddDialog
                            visible={showAddDialog}
                            roles={unassignedRoles}
                            role={selectedRole}
                            onChange={setSelectedRole}
                            onAdd={addRole}
                            onHide={hideAddDialog}
                        />}

                    {selectedRole &&
                        <DeleteDialog
                            showDeleteDialog={showDeleteDialog}
                            selectedDataInfo={`${selectedRole.role_name} role from ${user.user_name} user`}
                            onDelete={deleteRole}
                            onHide={() => setShowDeleteDialog(false)}
                        />}
                </div>
            </div>
        </div>
    );
};

export default UserRoleComp;
