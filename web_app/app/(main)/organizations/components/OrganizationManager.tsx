'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';
import { OrganizationApi } from '../api/organization.api';
import {
    FilterOrganization,
    ORGANIZATION_TYPE_ICONS,
    Organization,
    OrgnUnit,
    getParentType
} from '../models/organization.model';
import OrganizationForm from './OrganizationForm';
import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
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

const getOrganizationColumns = (type: OrgnUnit): ColumnProps[] => {
    const parentType = getParentType(type);

    return [
        { header: "Name", field: "name", sortable: true },

        ...(parentType !== undefined
            ? [
                {
                    header: capitalize(parentType),
                    // "parent.name" so sorting and search use the name, not the object.
                    // The body still handles a parent that is just an id string.
                    field: "parent.name",
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

// Keep the permission ids the user picked: the API response may not echo them back
const mapSaved = (saved: Organization, submitted: Partial<Organization>): Organization => ({
    ...saved,
    parent: submitted.parent ?? saved.parent,
});

export default function OrganizationManager({ type }: Props) {
    const toast = useToast();

    const columns = useMemo(() => getOrganizationColumns(type), [type]);
    const filter = useMemo<FilterOrganization>(() => ({ type }), [type]);

    return (
        <ItemManager<Organization, FilterOrganization>
            key={type} // resets the list and dialog when switching between types
            api={OrganizationApi}
            resource={`organization:${type}`}
            itemName={capitalize(type)}
            itemIcon={ORGANIZATION_TYPE_ICONS[type]}
            mapSaved={mapSaved}
            headerTitle={`Manage ${capitalize(type)}s`}
            columns={columns}
            filter={filter}
            dialogWidth="450px"
            // Pass the current type property down to the form
            renderForm={(props) => <OrganizationForm {...props} type={type} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === "create"
                        ? `${capitalize(type)} created`
                        : `${capitalize(type)} updated`
                )
            }
        />
    );
}