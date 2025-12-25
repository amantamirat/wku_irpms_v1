'use client';
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { Button } from "primereact/button";
import { ToggleButton } from "primereact/togglebutton";
import { useEffect, useState } from "react";
import { UserApi } from "../api/UserService";
import SaveDialog from "../dialogs/SaveDialog";
import { User, UserStatus } from "../models/user.model";


const UserManager = () => {

    const emptyUser: User = {
        email: "",
        password: "",
        status: UserStatus.pending,
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.USER.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.USER.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.USER.DELETE]);

    const canActivate = hasPermission([PERMISSIONS.USER.STATUS.ACTIVATE]);
    //const canPend = hasPermission([PERMISSIONS.USER.STATUS.PEND]);
    const canSuspend = hasPermission([PERMISSIONS.USER.STATUS.SUSPEND]);


    /*
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    */


    // const canReset = !showDeleted && hasPermission([PERMISSIONS.USER.RESET]);

    // CRUD hook
    const {
        items: users,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<User>();


    const [user, setUser] = useState<User>(emptyUser);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    //const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const data = await UserApi.getUsers(); // fetch ALL without filter
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch users. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);


    /*
    useEffect(() => {
        if (showDeleted) {
            setAll(allUsers.filter(u => u.status === UserStatus.deleted));
        } else {
            setAll(allUsers.filter(u => u.status !== UserStatus.deleted));
        }
    }, [showDeleted, allUsers]);
    */


    // Save callback
    const onSaveComplete = (saved: User, hide: boolean = true) => {
        updateItem(saved);
        /*
        setAllUsers(prev => {
            const index = prev.findIndex(i => i._id === saved._id);
            // If user exists → update it
            if (index !== -1) {
                return prev.map(u =>
                    u._id === saved._id ? saved : u
                );
            }
            // If not exists → add it
            return [...prev, saved];
        });
        */
        if (hide)
            hideDialogs();
    };

    const updateStatus = async (row: User, next: UserStatus) => {
        if (!row._id) {
            return
        }
        const updated = await UserApi.updateStatus(row._id, next);
        onSaveComplete({
            ...updated,
            applicant: row.applicant
        }, false);
    };

    // Permanent 
    const deleteUser = async (row: User) => {
        if (!row._id) {
            return
        }
        const ok = await UserApi.delete(row._id);
        if (ok) removeItem(row);
        /*
        if (ok && row.status === UserStatus.deleted) {
            setAllUsers(allUsers.filter(u => u._id !== row._id));
            return
        }
        onSaveComplete({
            ...ok,
            applicant: row.applicant,
        }, false);
        */
    };

    const hideDialogs = () => {
        setUser(emptyUser);
        setShowSaveDialog(false);
        // setShowPasswordDialog(false);
    };

    /*
    const updateStatus = async (row: User, next: UserStatus) => {
        const updated = await UserApi.updateUser({ _id: row._id, status: next }, true);
        onSaveComplete({
            ...updated,
            applicant: row.applicant,
        }, false);
        //updateItem({ ...updated, roles: row.roles, organizations: row.organizations });
    };
    */

    const stateTransitionTemplate = (rowData: User) => {
        const state = rowData.status;

        return (<div className="flex gap-2">
            {(canActivate && (state === UserStatus.pending || state === UserStatus.suspended)) &&
                <Button
                    tooltip="Activate"
                    icon="pi pi-check"
                    severity="success"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'activate',
                            onConfirmAsync: () => updateStatus(rowData, UserStatus.active)
                        });
                    }}
                />}

            {(canSuspend && state === UserStatus.active) &&
                <Button
                    tooltip="Suspend"
                    icon="pi pi-stop"
                    severity="danger"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: 'Suspend',
                            onConfirmAsync: () => updateStatus(rowData, UserStatus.suspended)
                        });
                    }}
                />
            }
        </div>);
    }

    // Columns
    const columns = [
        {
            //header: "Username", field: "user_name" 
        },
        { header: "Email", field: "email" },

        {
            header: "Name", field: "applicant.name"
        },
        {
            //header: "Roles", body: (u: User) => u.roles?.length ?? 0 

        },
        {
            // header: "Organizations", body: (u: User) => u.organizations?.length ?? 0 
        },
        {
            header: "Status",
            field: "status",
            body: (u: User) => <MyBadge type="status" value={u.status ?? "Unknown"} />
        },
        { body: stateTransitionTemplate }
    ].filter(Boolean);

    return (
        <>
            <CrudManager
                headerTitle={"Manage Users"}
                itemName="User"
                items={users}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => {
                    setUser({ ...emptyUser });
                    setShowSaveDialog(true && canCreate);
                }}
                onEdit={(row) => {
                    setUser({ ...row });
                    setShowSaveDialog(true && canEdit);
                }}
                onDelete={(row) =>
                    confirm.ask({
                        item: row.email,
                        onConfirmAsync: () => deleteUser(row)
                    })
                }
                /**
                 * 
                 * extraActions={
                    (row) =>
                        canReset && <Button
                            icon="pi pi-refresh" rounded severity="warning" className="p-button-rounded p-button-text"
                            style={{ fontSize: '2rem' }}
                            onClick={() => {
                                setUser(row);
                                setShowPasswordDialog(true);
                            }}
                        />
                }
                 */

                /*
                                toolbarEnd={
                                    <ToggleButton checked={showDeleted}
                                        onChange={(e) => setShowDeleted(e.value)}
                                        offLabel="Trash"
                                        onLabel="Users"
                                        offIcon="pi pi-trash"
                                        onIcon="pi pi-users"
                                    />
                                }
                                    */
                enableSearch
            />

            {/* Save User Dialog */}
            {
                user && <SaveDialog
                    visible={showSaveDialog}
                    user={user}
                    enableCurrentPassword={false}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            }

            {/* Reset Password Dialog 
             {user._id && (
                <ChangePasswordDialog
                    visible={showPasswordDialog}
                    id={user._id}
                    //reset={true}
                    onComplete={hideDialogs}
                    onHide={hideDialogs}
                />
            )}
            
            */}

        </>
    );
};

export default UserManager;
