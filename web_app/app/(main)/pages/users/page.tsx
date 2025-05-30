'use client';
import DeleteDialog from '@/components/DeleteDialog';
import { User, UserStatus } from '@/models/user';
import { UserService } from '@/services/UserService';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableExpandedRows, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import SaveDialog from './dialogs/SaveDialog';
import UserRoleComp from '../../components/userRole/UserRole';
import { Role } from '@/models/role';
import { RoleService } from '@/services/RoleService';



const UserPage = () => {
    let emptyUser: User = {
        user_name: '',
        email: '',
        status: UserStatus.Pending,
        roles: []
    };
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({});

    const [selectedUser, setSelectedUser] = useState<User>(emptyUser);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [expandedRows, setExpandedRows] = useState<any[] | DataTableExpandedRows>([]);


    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
        loadUsers();
        loadRoles();
    }, []);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    const loadUsers = async () => {
        try {
            const data = await UserService.getUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to load users:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load users data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const loadRoles = async () => {
        try {
            const data = await RoleService.getRoles();
            //console.log(data);
            setRoles(data);
        } catch (err) {
            console.error('Failed to load roles:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to load roles data',
                detail: '' + err,
                life: 3000
            });
        }
    };

    const saveUser = async () => {
        try {
            let _users = [...(users as any)];
            if (selectedUser._id) {
                const updatedUser = await UserService.updateUser(selectedUser);
                const index = users.findIndex((user) => user._id === selectedUser._id);
                _users[index] = selectedUser;
            } else {
                const newUser = await UserService.createUser(selectedUser);
                _users.push(newUser);
            }
            setUsers(_users);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `User ${selectedUser._id ? "updated" : 'created'}`,
                life: 3000
            });
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: `Failed to ${selectedUser._id ? "update" : 'create'} user`,
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowSaveDialog(false);
            setSelectedUser(emptyUser);
        }

    };


    const deleteUser = async () => {
        try {
            const deleted = await UserService.deleteUser(selectedUser);
            if (deleted) {
                let _users = (users as any)?.filter((val: any) => val._id !== selectedUser._id);
                setUsers(_users);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Successful',
                    detail: 'User Deleted',
                    life: 3000
                });
            }
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to delete users',
                detail: '' + error,
                life: 3000
            });
        } finally {
            setShowDeleteDialog(false);
            setSelectedUser(emptyUser);
        }

    };

    const openSaveDialog = (user: User) => {
        setSelectedUser({ ...user });
        setShowSaveDialog(true);
    };


    const hideSaveDialog = () => {
        setShowSaveDialog(false);
        setSelectedUser(emptyUser);
    };



    const confirmDeleteItem = (user: User) => {
        setSelectedUser(user);
        setShowDeleteDialog(true);
    };

    const startToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New User" icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptyUser)} />
                </div>
            </React.Fragment>
        );
    };



    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0">Manage Users</h5>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" value={globalFilter} onChange={onGlobalFilterChange} placeholder="Search..." className="w-full md:w-1/3" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData: User) => {
        return (
            <>
                <Button icon="pi pi-pencil" rounded severity="success" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => openSaveDialog(rowData)} />
                <Button icon="pi pi-trash" rounded severity="warning" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => confirmDeleteItem(rowData)} />
            </>
        );
    };

    const statusBodyTemplate = (rowData: User) => {
        return (
            <>
                <span className="p-column-title">Status</span>
                <span className={`user-badge status-${rowData.status?.toLowerCase()}`}>{rowData.status}</span>
            </>
        );
    };

    const handleUpdate = (updated: User) => {
        let _users = [...users]
        const index = users.findIndex((usr) => usr._id === updated._id);
        _users[index] = { ...updated };
        setUsers(_users);
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" start={startToolbarTemplate}></Toolbar>
                    <DataTable
                        ref={dt}
                        value={users}
                        selection={selectedUser}
                        onSelectionChange={(e) => setSelectedUser(e.value as User)}
                        dataKey="_id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
                        globalFilter={globalFilter}
                        emptyMessage="No user data found."
                        header={header}
                        scrollable
                        filters={filters}
                        expandedRows={expandedRows}
                        onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={(data) => (
                            <UserRoleComp
                                roles={roles}
                                user={data as User}
                                onUpdate={handleUpdate}
                            />
                        )}
                    >
                        <Column expander style={{ width: '3em' }} />
                        <Column
                            header="#"
                            body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="user_name" header="USER" sortable headerStyle={{ minWidth: '15rem' }}></Column>
                        <Column field="email" header="EMAIL" sortable />
                        <Column field="status" header="STATUS" sortable body={statusBodyTemplate} />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }}></Column>
                    </DataTable>

                    {selectedUser && <SaveDialog
                        visible={showSaveDialog}
                        user={selectedUser}
                        onChange={setSelectedUser}
                        onSave={saveUser}
                        onHide={hideSaveDialog}
                    />}

                    {selectedUser && <DeleteDialog
                        showDeleteDialog={showDeleteDialog}
                        selectedDataInfo={selectedUser.user_name}
                        onDelete={deleteUser}
                        onHide={() => setShowDeleteDialog(false)}
                    />}

                </div>
            </div>
        </div>
    );
};

export default UserPage;
