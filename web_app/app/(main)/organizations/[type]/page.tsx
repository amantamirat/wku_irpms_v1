'use client';
import React from 'react';
import { useParams, notFound } from 'next/navigation';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Tag } from 'primereact/tag';

import { OrgnUnit } from '../models/organization.model';
import OrganizationManager from '../components/OrganizationManager';
/*
const formatUnitTitle = (unit: string): string => {
    return unit
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .concat('s');
};
*/
const Page = () => {
    const params = useParams();
    const rawType = params.type as string;

    // Validate that the URL parameter is a valid OrgnUnit enum value
    const isValidType = Object.values(OrgnUnit).includes(rawType as OrgnUnit);

    if (!isValidType) {
        notFound();
    }

    const type = rawType as OrgnUnit;
  //  const formattedTitle = formatUnitTitle(type);

    const breadcrumbItems = [
        { label: 'Organizations' },
    //    { label: formattedTitle },
    ];
    const breadcrumbHome = { icon: 'pi pi-home', url: '/' };

    return (
        <OrganizationManager key={type} type={type} />
    );
};

export default Page;