'use client';
import { notFound, useParams } from 'next/navigation';

import OrganizationManager from '../components/OrganizationManager';
import { OrgnUnit } from '../models/organization.model';
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
  

    return (
        <OrganizationManager key={type} type={type} />
    );
};

export default Page;