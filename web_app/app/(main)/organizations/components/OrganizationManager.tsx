'use client';

import React from 'react';
import { createEntityManager } from "@/components/createEntityManager";
import { OrganizationApi } from "../api/organization.api";
import {
    Organization,
    OrgnUnit,
    FilterOrganization,
    createEmptyOrganization,
    getParentType
} from "../models/organization.model";
import SaveOrganization from "./SaveOrganization";

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

// Pure function to generate dynamic column schemas based on OrgnUnit type
const getOrganizationColumns = (type: OrgnUnit) => [
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
                body: (r: Organization) => renderBadge(r.academicLevel, "academic")
            },
            {
                header: "Classification",
                field: "classification",
                sortable: true,
                body: (r: Organization) => renderBadge(r.classification, "classification")
            }
        ]
        : []),

    ...(type === OrgnUnit.external
        ? [
            {
                header: "Ownership",
                field: "ownership",
                sortable: true,
                body: (r: Organization) => renderBadge(r.ownership, "ownership")
            }
        ]
        : [])
];

const OrganizationManager = ({ type }: Props) => {
    // Pass configured dynamic props directly into the EntityManager instance
    // ensuring the component reference stays stable across renders.
    const Manager = createEntityManager<Organization, FilterOrganization | undefined>({
        title: `Manage ${type}s`,
        itemName: type,
        api: OrganizationApi,
        columns: getOrganizationColumns(type),
        createNew: () => createEmptyOrganization({ type }),
        SaveDialog: SaveOrganization,
        permissionPrefix: `organization:${type}`,
        query: () => ({ type, populate: true })
    });

    return <Manager key={type} />;
};

export default OrganizationManager;