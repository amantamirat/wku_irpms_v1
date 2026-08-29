'use client';

import React from 'react';
import { useParams, notFound } from 'next/navigation';
import { OrgnUnit } from '../models/organization.model';
import OrganizationManager from '../components/OrganizationManager';

const Page = () => {
    const params = useParams();
    const rawType = params.type as string;

    // Validate that the URL parameter is a valid OrgnUnit enum value
    const isValidType = Object.values(OrgnUnit).includes(rawType as OrgnUnit);

    if (!isValidType) {
        notFound(); // Renders Next.js 404 page for invalid organization types
    }

    const type = rawType as OrgnUnit;

    return (
        // Passing key forces React to reset state cleanly when switching routes
        <OrganizationManager key={type} type={type} />
    );
};

export default Page;