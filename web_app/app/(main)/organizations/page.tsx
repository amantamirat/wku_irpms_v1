'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrganizationalUnit } from './models/organization.model';
import OrganizationManager from './components/OrganizationManager';

const OrganizationPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const typeParam = searchParams.get('type');

    const isValidType = (value: string): value is OrganizationalUnit =>
        Object.values(OrganizationalUnit).includes(value as OrganizationalUnit);

    const shouldRedirect = !typeParam || !isValidType(typeParam);

    useEffect(() => {
        if (shouldRedirect) {
            router.push('/');
        }
    }, [shouldRedirect, router]);

    if (shouldRedirect) {
        return null;
    }
    const type = typeParam as OrganizationalUnit;
    
    return (
        <OrganizationManager type={type} />
    );
};

export default OrganizationPage;
