'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrgnUnit } from './models/organization.model';
import OrganizationManager from './components/OrganizationManager';

const OrganizationPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const typeParam = searchParams.get('type');

    const isValidType = (value: string): value is OrgnUnit =>
        Object.values(OrgnUnit).includes(value as OrgnUnit);

    const shouldRedirect = !typeParam || !isValidType(typeParam);

    useEffect(() => {
        if (shouldRedirect) {
            router.push('/');
        }
    }, [shouldRedirect, router]);

    if (shouldRedirect) {
        return null;
    }
    const type = typeParam as OrgnUnit;
    
    return (
        <OrganizationManager type={type} />
    );
};

export default OrganizationPage;
