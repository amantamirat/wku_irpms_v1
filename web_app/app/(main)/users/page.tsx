'use client';
import ConfirmDialog from '@/components/ConfirmationDialog';
import { handleGlobalFilterChange, initFilters } from '@/utils/filterUtils';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { UserApi } from './api/UserService';
import SaveDialog from './dialogs/SaveDialog';
import { User, UserStatus } from './models/user.model';
import ChangePasswordDialog from './dialogs/ChangePassword';
import { InputSwitch } from 'primereact/inputswitch';
import ErrorCard from '@/components/ErrorCard';
import Badge from '@/templates/Badge';


const UserPage = () => {
    let emptyUser: User = {
        user_name: '',
        email: '',
        status: UserStatus.Pending,
        roles: []
    };
    const [globalFilter, setGlobalFilter] = useState('');

    const dt = useRef<DataTable<any>>(null);
    const [showDeleted, setShowDeleted] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<DataTableFilterMeta>({});
    const [selectedUser, setSelectedUser] = useState<User>(emptyUser);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleGlobalFilterChange(e, filters, setFilters, setGlobalFilter);
    };

    useEffect(() => {
        setFilters(initFilters());
        setGlobalFilter('');
    }, []);


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await UserApi.getUsers();
                setUsers(data);
            } catch (err) {
                setError("Failed to fetch users:" + err);
            }
        };
        fetchUsers();
    }, []);


    if (error) {
        return (
            <ErrorCard errorMessage={error} />
        );
    }


    const onSaveComplete = (savedUser: User) => {
        let _users = [...users]; // users is your local state array of User
        const index = _users.findIndex((u) => u._id === savedUser._id);
        if (index !== -1) {
            _users[index] = { ...savedUser };
        } else {
            _users.push({ ...savedUser });
        }
        setUsers(_users); // update state
        hideDialogs();    // close your SaveUserDialog
    };



    const deleteUser = async () => {
        const deleted = await UserApi.deleteUser(selectedUser);
        if (deleted) {
            let _users = [...users];
            if (selectedUser.status === UserStatus.Deleted) {
                // Permanent deletion
                _users = _users.filter(u => u._id !== selectedUser._id);
            } else {
                // Soft deletion
                const index = _users.findIndex(u => u._id === selectedUser._id);
                if (index !== -1) {
                    _users[index] = { ..._users[index], status: UserStatus.Deleted };
                }
            }
            setUsers(_users);
            hideDialogs();
        }
    };


    const openSaveDialog = (user: User) => {
        setSelectedUser({ ...user });
        setShowSaveDialog(true);
    };

    const openResetPasswordDialog = (user: User) => {
        setSelectedUser({ ...user });
        setShowPasswordDialog(true);
    };


    const hideDialogs = () => {
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
        setShowPasswordDialog(false);
        setSelectedUser(emptyUser);
    };

    const confirmDeleteItem = (user: User) => {
        setSelectedUser(user);
        setShowDeleteDialog(true);
    };


    const endToolbarTemplate = () => {
        return (
            <div className="my-2">
                <label htmlFor="show-deleted">Row Click</label>
                <InputSwitch inputId="show-deleted" checked={showDeleted} onChange={(e) => setShowDeleted(e.value)} />
            </div>
        );
    };


    const startToolbarTemplate = () => {
        return (
            <div className="my-2">
                <Button label="New User" icon="pi pi-plus" severity="success" className="mr-2" onClick={() => openSaveDialog(emptyUser)} />
            </div>
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

                <Button
                    icon="pi pi-refresh" rounded severity="warning" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => openResetPasswordDialog(rowData)}
                />
                <Button icon={rowData.status !== UserStatus.Deleted ? "pi pi-user-minus" :
                    "pi pi-times"}
                    rounded severity="danger" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => confirmDeleteItem(rowData)} />
            </>
        );
    };

    const statusBodyTemplate = (rowData: User) => {
        return (
            <>
                <span className="p-column-title">Status</span>
                <Badge type="status" value={rowData.status ?? 'Unknown'} />
            </>
        );
    };


    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
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
                    >
                        <Column selectionMode="single" headerStyle={{ width: '3em' }} />
                        <Column
                            header="#" body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="user_name" header="Username" sortable />
                        <Column field="email" header="Email" sortable />
                        <Column header="Roles" body={(rowData) => rowData.roles?.length || 0} />
                        <Column header="Organizations" body={(rowData) => rowData.organizations?.length || 0} />
                        <Column field="status" header="Status" sortable body={statusBodyTemplate} />
                        <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
                    </DataTable>

                    {selectedUser && <SaveDialog
                        visible={showSaveDialog}
                        user={selectedUser}
                        onComplete={onSaveComplete}
                        onHide={hideDialogs}
                    />}

                    {selectedUser._id && <ChangePasswordDialog
                        visible={showPasswordDialog}
                        id={selectedUser._id}
                        reset={true}
                        onComplete={hideDialogs}
                        onHide={hideDialogs}
                    />}

                    {selectedUser && <ConfirmDialog
                        showDialog={showDeleteDialog}
                        item={selectedUser.user_name}
                        onConfirmAsync={deleteUser}
                        onHide={hideDialogs}
                    />}

                </div>
            </div>
        </div>
    );
};

export default UserPage;
