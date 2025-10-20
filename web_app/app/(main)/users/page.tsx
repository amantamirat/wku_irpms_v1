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


const UserPage = () => {
    let emptyUser: User = {
        user_name: '',
        email: '',
        status: UserStatus.Pending,
        roles: []
    };
    const [users, setUsers] = useState<User[]>([]);
    const dt = useRef<DataTable<any>>(null);
    const [globalFilter, setGlobalFilter] = useState('');
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
                console.error("Failed to fetch users:", err);
            }
        };
        fetchUsers();
    }, []);



    const onSaveComplete = (savedUser: User) => {
        let _users = [...users]; // users is your local state array of User
        const index = _users.findIndex((u) => u._id === savedUser._id);

        if (index !== -1) {
            // Replace existing user
            _users[index] = { ...savedUser };
        } else {
            // Add new user
            _users.push({ ...savedUser });
        }

        setUsers(_users); // update state
        hideDialogs();    // close your SaveUserDialog
    };



    const deleteUser = async () => {
        const deleted = await UserApi.deleteUser(selectedUser);
        if (deleted) {
            let _users = [...users];

            if (selectedUser.status === UserStatus.Active) {
                // Active users cannot be deleted, do nothing
                return;
            }

            if (selectedUser.status === UserStatus.Pending) {
                // Mark pending user as deleted locally
                const index = _users.findIndex(u => u._id === selectedUser._id);
                if (index !== -1) {
                    _users[index] = { ..._users[index], status: UserStatus.Deleted };
                }
            } else if (selectedUser.status === UserStatus.Deleted) {
                // Permanent deletion
                _users = _users.filter(u => u._id !== selectedUser._id);
            }

            setUsers(_users);
            hideDialogs();
        }
    };


    /*

    const linkUser = async () => {
        try {
            const updatedUser = await UserApi.linkUser(selectedUser);
            let _users = [...(users as any)];
            const index = users.findIndex((user) => user._id === selectedUser._id);
            _users[index] = { ...selectedUser, linkedApplicant: updatedUser.linkedApplicant };
            setUsers(_users);
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'User Linked',
                life: 3000
            });
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to link user',
                detail: '' + error,
                life: 3000
            });
        } finally {
            hideDialog();
        }

    };

    */

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

                <Button
                    icon="pi pi-refresh" rounded severity="danger" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => openResetPasswordDialog(rowData)}
                />
                <Button icon={rowData.status === UserStatus.Active ? "pi pi-user-minus" : rowData.status === UserStatus.Suspended ? "pi pi-user-plus" :
                    "pi pi-times"}
                    rounded severity="warning" className="p-button-rounded p-button-text"
                    style={{ fontSize: '2rem' }} onClick={() => confirmDeleteItem(rowData)} />
            </>
        );
    };

    const statusBodyTemplate = (rowData: User) => {
        return (
            <>
                <span className="p-column-title">Status</span>
                <span className={`status-badge status-${rowData.status?.toLowerCase()}`}>{rowData.status}</span>
            </>
        );
    };

    const linkedBodyTemplate = (rowData: any) => {
        return rowData.linkedApplicant ? <span className='user-badge linked'>Linked</span> :
            <span className='user-badge notlinked'>Not Linked</span>;
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
                        <Column
                            header="#" body={(rowData, options) => options.rowIndex + 1}
                            style={{ width: '50px' }}
                        />
                        <Column field="user_name" header="Username" sortable />
                        <Column field="email" header="Email" sortable />
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


                    {/*selectedUser && !selectedUser.linkedApplicant && <ConfirmDialog
                        showDialog={showLinkDialog}
                        operation="link"
                        selectedDataInfo={selectedUser.user_name}
                        onConfirmAsync={linkUser}
                        onHide={hideDialog}
                    />*/}

                    {selectedUser && <ConfirmDialog
                        showDialog={showDeleteDialog}
                        operation={selectedUser.status === UserStatus.Active ? 'suspend' :
                            selectedUser.status === UserStatus.Suspended ? 'activate' : 'remove'}
                        selectedDataInfo={selectedUser.user_name}
                        onConfirmAsync={deleteUser}
                        onHide={hideDialogs}
                    />}

                </div>
            </div>
        </div>
    );
};

export default UserPage;
