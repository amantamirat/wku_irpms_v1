'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { Call, CallStatus } from "../models/call.model";
import { CallApi } from "../api/call.api";
import SaveCall from "./SaveCall";
import StageManager from "../stages/components/StageManager";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import MyBadge from "@/templates/MyBadge";
import { Button } from "primereact/button";
import { Calendar } from "../../calendars/models/calendar.model";
import ProjectManager from "../../projects/components/ProjectManager";
import { Organization, OrgnUnit } from "../../organizations/models/organization.model";
import { OrganizationApi } from "../../organizations/api/organization.api";
import { Dropdown } from "primereact/dropdown";
import { useDirectorate } from "@/contexts/DirectorateContext";
import { DirectorateSelector } from "@/components/DirectorateSelector";

interface CallManagerProps {
    calendar?: Calendar;
    next?: "stage" | "project";
}

const CallManager = ({ calendar, next = "stage" }: CallManagerProps) => {


    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.CALL.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.CALL.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.CALL.DELETE]);

    const canActivate = hasPermission([PERMISSIONS.CALL.STATUS.ACTIVATE]);
    const canClose = hasPermission([PERMISSIONS.CALL.STATUS.CLOSE]);
    const canPlan = hasPermission([PERMISSIONS.CALL.STATUS.PLANNED]);

    //const canChangeStatus = hasPermission([PERMISSIONS.CALL.CHANGE_STATUS]);

    /** CRUD Hook */
    const {
        items: cycles,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Call>();

    const { directorate, directorates } = useDirectorate();

    // const [directorates, setDirectorates] = useState<Organization[] | undefined>(undefined);
    // const [directorate, setDirectorate] = useState<Organization | undefined>(undefined);

    const emptyCycle: Call = {
        calendar: calendar ?? "",
        directorate: directorate ?? "",
        title: "",
        grant: "",
        thematic: "",
        status: CallStatus.planned
    };

    const [calls, setCalls] = useState<Call>(emptyCycle);
    const [showSaveDialog, setShowSaveDialog] = useState(false);


    /** 
     * useEffect(() => {
        const fetchDirectorates = async () => {
            try {
                setLoading(true);
                let directorates = getScopesByUnit(OrgnUnit.Department);
                if (directorates === "*") {
                    directorates = await OrganizationApi.getOrganizations({ type: OrgnUnit.Directorate });
                }
                setDirectorates(directorates);
            } catch (err: any) {
                setError("Failed to load directorates: " + err?.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDirectorates();
    }, []);
    */


    /** Fetch calls */
    useEffect(() => {
        if (!directorate && !calendar) {
            return
        }
        const fetchCalls = async () => {
            try {
                setLoading(true);
                const data = await CallApi.getCalls({ calendar, directorate });
                setAll(data);
            } catch (err: any) {
                setError("Failed to load calendars. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, [calendar, directorate]);

    /** Save cycle */
    const onSaveComplete = (saved: Call) => {
        updateItem(saved);
        hideDialogs();
    };

    const updateStatus = async (row: Call, next: CallStatus) => {
        if (!row._id) {
            return
        }
        const updated = await CallApi.updateStatus(row._id, next);
        onSaveComplete({
            ...updated,
            calendar: row.calendar,
            directorate: row.directorate,
            thematic: row.thematic,
            grant: row.grant
        });
    };


    const stateTransitionTemplate = (rowData: Call) => {
        const state = rowData.status;
        return (
            <div className="flex gap-2">
                {canActivate && <>
                    {(state === CallStatus.planned || state === CallStatus.closed) &&
                        <Button
                            label="Activate"
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'activate',
                                    onConfirmAsync: () => updateStatus(rowData, CallStatus.active)
                                });
                            }}
                        />
                    }
                </>}
                {canClose && <>
                    {(state === CallStatus.active) &&
                        <Button
                            tooltip="Close"
                            icon="pi pi-lock"
                            severity="danger"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'close',
                                    onConfirmAsync: () => updateStatus(rowData, CallStatus.closed)
                                });
                            }}
                        />
                    }
                </>}

                {canPlan && <>
                    {(state === CallStatus.active) &&
                        <Button
                            tooltip="Plan"
                            icon="pi pi-arrow-left"
                            severity="warning"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'change to plan',
                                    onConfirmAsync: () => updateStatus(rowData, CallStatus.planned)
                                });
                            }}
                        />
                    }
                </>}
            </div>);
    }

    /** Delete */
    const deleteCall = async (row: Call) => {
        const ok = await CallApi.delete(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Columns for CrudManager */
    const columns = [
        !calendar && { header: "Calendar", field: "calendar.year" },
        calendar && { header: "Directorate", field: "directorate.name" },
        { header: "Title", field: "title" },
        { header: "Grant", field: "grant.title" },
        { header: "Theme", field: "thematic.title" },
        {
            header: "Status",
            body: (row: Call) => <MyBadge type="status" value={row.status ?? "Unknown"} />,
            sortable: true
        },
        { body: stateTransitionTemplate }
    ];

    const topTemplate = () => {
        if (calendar) {
            return undefined;
        }
        return (<DirectorateSelector />)
    };

    /*
    const topTemplate = () => {
        if (calendar) {
            return undefined;
        }
        return (
            <div className="card p-fluid">
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6 lg:col-4">
                        <label htmlFor="directorate">Directorate</label>
                        <Dropdown
                            id="workspace"
                            value={directorate}
                            options={directorates}
                            onChange={(e) => setDirectorate(e.value)}
                            optionLabel="name"
                            placeholder="Select Directorate"
                        />
                    </div>
                </div>
            </div>
        );
    }
        */

    return (
        <>
            <CrudManager
                headerTitle={`Manage Calls`}
                itemName="Call"
                items={cycles}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                /** Permissions */
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                /** Create */
                onCreate={() => {
                    setCalls({ ...emptyCycle });
                    setShowSaveDialog(true);
                }}

                /** Edit */
                onEdit={(row) => {
                    setCalls({ ...row });
                    setShowSaveDialog(true);
                }}

                /** Delete */
                onDelete={(row) =>
                    confirm.ask({
                        item: row.title,
                        onConfirmAsync: () => deleteCall(row)
                    })
                }

                topTemplate={topTemplate()}
                //enableSearch
                rowExpansionTemplate={(row) => {
                    if (next === "project") {
                        return (<ProjectManager call={row} />)
                    }
                    return (<StageManager call={row} />)
                }}
            />

            {/* Save Dialog */}
            {calls && (
                <SaveCall
                    visible={showSaveDialog}
                    call={calls}
                    directorates={directorates}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default CallManager;
