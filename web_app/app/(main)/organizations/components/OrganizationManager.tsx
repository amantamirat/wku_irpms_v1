'use client';

import React from 'react';
import { OrganizationApi } from "../api/organization.api";
import {
    Organization,
    OrgnUnit,
    FilterOrganization,
    createEmptyOrganization,
    getParentType
} from "../models/organization.model";
import SaveOrganization from "./SaveOrganization";
import { createEntityManager } from '@/components/data-table/createEntityManager';
import { capitalize } from '@/utils/utils';

interface Props {
    type: OrgnUnit;
}

// Helper to keep badge rendering consistent
const renderBadge = (value: string | undefined, prefix: string) => {
    if (!value) return null;
    return (
        <span className={`${prefix}-badge ${prefix}-${value.toLowerCase()}`}>
            {value}
        </span>
    );
};

const getOrganizationColumns = (type: OrgnUnit) => {
    const parentType = getParentType(type);

    return [
        { header: "Name", field: "name", sortable: true },

        ...(parentType !== undefined
            ? [
                {
                    header: capitalize(parentType),
                    field: "parent",
                    sortable: true,
                    body: (r: Organization) =>
                        typeof r.parent === "object"
                            ? r.parent?.name
                            : r.parent
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
};

const OrganizationManager = ({ type }: Props) => {
    // Pass configured dynamic props directly into the EntityManager instance
    // ensuring the component reference stays stable across renders.
    const Manager = createEntityManager<Organization, FilterOrganization | undefined>({
        title: `Manage ${capitalize(type)}s`,
        itemName: capitalize(type),
        api: OrganizationApi,
        columns: getOrganizationColumns(type),
        createNew: () => createEmptyOrganization({ type }),
        SaveDialog: SaveOrganization,
        permissionPrefix: `organization:${type}`,
        query: () => ({ type })
    });

    return <Manager key={type} />;
};

export default OrganizationManager;