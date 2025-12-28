'use client';
import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useAuth } from "@/contexts/auth-context";
import React, { useEffect, useState } from "react";
import { OrganizationApi } from "../api/organization.api";
import {
    Organization,
    OrgnUnit,
    getChildType,
    getParentType
} from "../models/organization.model";

import SaveDialog from "./SaveDialog";
import { PERMISSIONS } from "@/types/permissions";
import { Dropdown } from "primereact/dropdown";


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
    const { hasPermission, getScopesByUnit } = useAuth();
    const confirm = useConfirmDialog();

    const permissionKey = ORG_PERMISSION_KEY[type];
    const canCreate = hasPermission([PERMISSIONS.ORGANIAZTION[permissionKey].CREATE]);
    const canEdit = hasPermission([PERMISSIONS.ORGANIAZTION[permissionKey].UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.ORGANIAZTION[permissionKey].DELETE]);

    const childType = getChildType(type);
    const parentType = getParentType(type);

    const childPermKey = childType && ORG_PERMISSION_KEY[childType];
    const canReadChild = childPermKey && hasPermission([PERMISSIONS.ORGANIAZTION[childPermKey].READ]);

    const [localParent, setLocalParent] = useState<Organization | undefined>(
        parent ? { ...parent } : undefined
    );
    const [parents, setParents] = useState<Organization[] | undefined>(undefined);

    //const hasParent = !!localParent && !!parentType;

    const emptyOrganization: Organization = {
        name: "",
        type,
        parent: localParent
    };

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

    useEffect(() => {
        setLocalParent(parent ? { ...parent } : undefined);
        setParents(undefined);
        setAll([]);
        setSelectedItem({
            name: "",
            type,
            parent: parent ? { ...parent } : undefined
        });
    }, [type]);


    /** FETCH Parents*/
    useEffect(() => {
        if (!parentType) {
            return;
        }
        const fetchParents = async () => {
            try {
                setLoading(true);
                let parents = getScopesByUnit(parentType);
                if (parents === "*") {
                    parents = await OrganizationApi.getOrganizations({ type: parentType });
                }
                setParents(parents);
            } catch (err: any) {
                setError("Failed to load parents: " + err?.message);
            } finally {
                setLoading(false);
            }
        };
        fetchParents();
    }, [parentType, getScopesByUnit]);


    /** FETCH oranganizations*/
    useEffect(() => {
        const fetchOranizations = async () => {
            try {
                setLoading(true);
                if (parentType && !localParent) {
                    setAll([]);
                    return;
                }
                const data = await OrganizationApi.getOrganizations({ type, parent: localParent });
                setAll(data);
            } catch (err: any) {
                setError("Failed to load parents: " + err?.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOranizations();
    }, [type, localParent, parentType]);

    const [selectedItem, setSelectedItem] = useState<Organization>(emptyOrganization);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

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
        { header: "Name", field: "name", sortable: true },

        ...(type === OrgnUnit.Program
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

    const topTemplate = () => {
        if (!parentType) {
            return undefined;
        }
        return (
            <div className="card p-fluid">
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6 lg:col-4">
                        <label htmlFor="parent">{parentType}</label>
                        <Dropdown
                            id="parents"
                            value={localParent}
                            options={parents}
                            onChange={(e) => setLocalParent(e.value)}
                            optionLabel="name"
                            placeholder={`Select ${parentType}`}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <CrudManager
                //headerTitle={`Manage ${localParent?.name ?? ""} ${type}s`}
                headerTitle={`Manage ${type}s`}
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
                
                topTemplate={topTemplate()}
                
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
            />
            <SaveDialog
                visible={showSaveDialog}
                organization={selectedItem}
                parents={parents}
                parentType={parentType}
                onComplete={onSaveComplete}
                onHide={hideDialogs}
            />
        </>
    );
};

export default OrganizationManager;
