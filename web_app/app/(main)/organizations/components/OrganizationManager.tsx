'use client';
import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useAuth } from "@/contexts/auth-context";
import React, { useEffect, useState, useCallback } from "react";

import { OrganizationApi } from "../api/organization.api";
import {
    Organization,
    OrgnUnit,
    getChildType,
    getParentType
} from "../models/organization.model";

import SaveDialog from "./SaveDialog";
import { PERMISSIONS } from "@/types/permissions";
import { TabView, TabPanel } from "primereact/tabview";
import ApplicantManager from "../../applicants/components/ApplicantManager";


const ORG_PERMISSION_KEY: Record<OrgnUnit, keyof typeof PERMISSIONS.ORGANIAZTION> = {
    College: "COLLEGE",
    Department: "DEPARTMENT",
    Program: "PROGRAM",
    Directorate: "DIRECTORATE",
    Center: "CENTER",
    External: "EXTERNAL",
};

interface OrganizationManagerProps {
    type: OrgnUnit;
    parent?: Organization;
}

const OrganizationManager = ({ type, parent }: OrganizationManagerProps) => {

    const emptyOrganization: Organization = {
        name: "",
        type,
        parent: parent
    };

    const childType = getChildType(type);
    const parentType = getParentType(type);
    const hasParent = !!parent;

    const {
        items: organizations,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Organization>();

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const permissionKey = ORG_PERMISSION_KEY[type];
    const canCreate = hasPermission([PERMISSIONS.ORGANIAZTION[permissionKey].CREATE]);
    const canEdit = hasPermission([PERMISSIONS.ORGANIAZTION[permissionKey].UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.ORGANIAZTION[permissionKey].DELETE]);



    const [selectedItem, setSelectedItem] = useState<Organization>(emptyOrganization);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch organizations */
    const fetchOrganizations = useCallback(async () => {
        try {
            setLoading(true);
            const data = await OrganizationApi.getOrganizations({ parent: parent, type })
            setAll(data);
        } catch (err: any) {
            setError("Failed to load organizations. " + (err?.message || ""));
        } finally {
            setLoading(false);
        }
    }, [parent, type]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    /** Save callback */
    const onSaveComplete = (saved: Organization) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete */
    const deleteOrganization = async (row: Organization) => {
        const ok = await OrganizationApi.deleteOrganization(row);
        if (ok) removeItem(row);
    };

    /** Hide all dialogs */
    const hideDialogs = () => {
        setSelectedItem(emptyOrganization);
        setShowSaveDialog(false);
    };

    /** Column definitions */
    const columns = [
        ...((!hasParent && parentType) ? [
            { header: parentType, field: "parent.name", sortable: true }
        ] : []),

        { header: "Name", field: "name", sortable: true },

        ...(type === OrgnUnit.Program //|| type === OrgnUnit.Specialization
            ? [{
                header: "Ac. Level",
                field: "academicLevel",
                sortable: true,
                body: (r: Organization) => (
                    <span className={`academic-badge level-${r.academicLevel?.toLowerCase()}`}>
                        {r.academicLevel}
                    </span>
                )
            }]
            : []
        ),

        ...(type === OrgnUnit.Program
            ? [{
                header: "Classification",
                field: "classification",
                sortable: true,
                body: (r: Organization) => (
                    <span className={`classification-badge classification-${r.classification?.toLowerCase()}`}>
                        {r.classification}
                    </span>
                )
            }]
            : []
        ),

        ...(type === OrgnUnit.External
            ? [{
                header: "Ownership",
                field: "ownership",
                sortable: true,
                body: (r: Organization) => (
                    <span className={`ownership-badge ownership-${r.ownership?.toLowerCase()}`}>
                        {r.ownership}
                    </span>
                )
            }]
            : []
        ),
    ];

    return (
        <>
            <CrudManager
                headerTitle={`Manage ${parent?.name ?? ""} ${type}s`}
                itemName={type}
                items={organizations}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                enableSearch
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setSelectedItem({ ...emptyOrganization });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setSelectedItem({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: row.name,
                        onConfirmAsync: () => deleteOrganization(row)
                    })
                }
                rowExpansionTemplate={(!childType && type !== OrgnUnit.External) ? undefined : (row) => {
                    if (type === OrgnUnit.Department) {
                        return (
                            <>
                                <TabView>
                                    <TabPanel header="Programs">
                                        <OrganizationManager
                                            type={childType!}
                                            parent={row}
                                        />
                                    </TabPanel>
                                    <TabPanel header="Staff">
                                        <ApplicantManager workspace={row} />
                                    </TabPanel>
                                </TabView>
                            </>);
                    }
                    else if (type === OrgnUnit.External) {
                        return (<ApplicantManager workspace={row} />);
                    }
                    return (
                        <OrganizationManager
                            type={childType!}
                            parent={row}
                        />
                    );
                }}
            />

            <SaveDialog
                visible={showSaveDialog}
                organization={selectedItem}
                hasParent={hasParent}
                parentType={parentType}
                onComplete={onSaveComplete}
                onHide={hideDialogs}
            />
        </>
    );
};

export default OrganizationManager;
