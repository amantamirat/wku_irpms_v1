'use client';

import { useMemo } from 'react';
import { createEntityManager } from "@/components/createEntityManager";
import { OrganizationApi } from "../api/organization.api";
import {
    Organization,
    OrgnUnit,
    GetOrganizationsOptions,
    createEmptyOrganization,
    getParentType
} from "../models/organization.model";
import SaveOrganization from "./SaveOrganization";

interface Props {
    type: OrgnUnit;
}

const OrganizationManager = ({ type }: Props) => {

    const Manager = useMemo(() => {
        // Helper to keep the column array readable
        const renderBadge = (value: string | undefined, prefix: string) => (
            <span className={`${prefix}-badge ${prefix}-${value?.toLowerCase()}`}>
                {value}
            </span>
        );

        const columns = [
            { header: "Name", field: "name", sortable: true },

            ...(getParentType(type) !== undefined
                ? [
                    {
                        header: "Parent",
                        field: "parent",
                        sortable: true,
                        body: (r: Organization) =>
                            typeof r.parent === "object" ? r.parent?.name : r.parent
                    }
                ]
                : []),

            ...(type === OrgnUnit.program
                ? [
                    {
                        header: "Ac. Level",
                        field: "academicLevel",
                        sortable: true,
                        body: (r: Organization) =>
                            renderBadge(r.academicLevel, "academic")
                    },
                    {
                        header: "Classification",
                        field: "classification",
                        sortable: true,
                        body: (r: Organization) =>
                            renderBadge(r.classification, "classification")
                    }
                ]
                : []),

            ...(type === OrgnUnit.external
                ? [
                    {
                        header: "Ownership",
                        field: "ownership",
                        sortable: true,
                        body: (r: Organization) =>
                            renderBadge(r.ownership, "ownership")
                    }
                ]
                : [])
        ];

        return createEntityManager<Organization, GetOrganizationsOptions | undefined>({
            title: `Manage ${type}s`,
            itemName: type,
            api: OrganizationApi,
            columns: columns,
            createNew: () => createEmptyOrganization({ type }),
            SaveDialog: SaveOrganization,
            permissionPrefix: `organization:${type}`,
            query: () => ({ type, populate: true })
        });
    }, [type]);

    return <Manager />;
};

export default OrganizationManager;