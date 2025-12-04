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

    const canCreate = true; //hasPermission([PERMISSIONS.ORG.CREATE]);
    const canEdit = true;//hasPermission([PERMISSIONS.ORG.UPDATE]);
    const canDelete = true;//hasPermission([PERMISSIONS.ORG.DELETE]);

    const [selectedItem, setSelectedItem] = useState<Organization>(emptyOrganization);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch organizations */
    const fetchOrganizations = useCallback(async () => {
        try {
            setLoading(true);

            const data = parent
                ? await OrganizationApi.getOrganizations({ parent: parent._id })
                : await OrganizationApi.getOrganizations({ type });

            setAll(data);
        } catch (err: any) {
            setError("Failed to load organizations. " + (err?.message || ""));
        } finally {
            setLoading(false);
        }
    }, [parent?._id, type]);

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
        ...((!parent && parentType) ? [
            { header: parentType, field: "parent.name", sortable: true }
        ] : []),
        { header: "Name", field: "name", sortable: true },

        ...(type === OrgnUnit.Program || type === OrgnUnit.Specialization
            ? [{
                header: "Ac. Level",
                field: "academic_level",
                sortable: true,
                body: (r: Organization) => (
                    <span className={`academic-badge level-${r.academic_level?.toLowerCase()}`}>
                        {r.academic_level}
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
                rowExpansionTemplate={!childType ? undefined : (row) => {
                    return (
                        <OrganizationManager
                            type={childType!}
                            parent={row}
                        />);
                }}
            />

            <SaveDialog
                visible={showSaveDialog}
                organization={selectedItem}
                parentType={parentType}
                onComplete={onSaveComplete}
                onHide={hideDialogs}
            />
        </>
    );
};

export default OrganizationManager;
